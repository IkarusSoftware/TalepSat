import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-session';
import { canSubscribeUserEvents, subscribeUserEvents } from '@/lib/event-bus';
import { consumeRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/security';

export const dynamic = 'force-dynamic';

function encodeEvent(type: string, data: unknown) {
  return `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(req: NextRequest) {
  const session = await getApiSession(req);
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ip = getClientIp(req);
  const rateLimit = consumeRateLimit({
    key: `events-stream:${session.userId}:${ip}`,
    limit: 12,
    windowMs: 60_000,
  });
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit, 'Canli baglanti limiti asildi.');
  }
  if (!canSubscribeUserEvents(session.userId)) {
    return NextResponse.json({ error: 'Maksimum canli baglanti sayisina ulastiniz.' }, { status: 429 });
  }

  const encoder = new TextEncoder();
  const subscriptionId = randomUUID();

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(': connected\n\n'));
      controller.enqueue(encoder.encode(encodeEvent('ready', { ok: true, timestamp: new Date().toISOString() })));

      const unsubscribe = subscribeUserEvents(session.userId, subscriptionId, (event) => {
        controller.enqueue(encoder.encode(encodeEvent('update', event)));
      });
      if (!unsubscribe) {
        controller.close();
        return;
      }

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
      }, 15000);

      const abort = () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Controller may already be closed when the connection is gone.
        }
      };

      req.signal.addEventListener('abort', abort);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
