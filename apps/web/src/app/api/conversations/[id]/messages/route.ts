import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-session';
import { normalizeResponseAttachments, normalizeStoredAttachments } from '@/lib/media';
import { prisma } from '@/lib/prisma';
import { eventForUser, emitRealtimeEvents } from '@/lib/realtime';
import { sendPushToUser } from '@/lib/push';
import { consumeRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/security';

const MAX_MESSAGE_LENGTH = 4000;
const MAX_ATTACHMENTS = 5;

type IncomingAttachment = {
  url: string;
  name?: string;
  type?: string;
  size?: number;
};

function parseAttachments(value: unknown): IncomingAttachment[] {
  if (!Array.isArray(value)) return [];

  return value
    .slice(0, MAX_ATTACHMENTS)
    .filter((item): item is IncomingAttachment => !!item && typeof item === 'object')
    .map((item) => ({
      url: typeof item.url === 'string' ? item.url.trim() : '',
      name: typeof item.name === 'string' ? item.name.trim().slice(0, 255) : undefined,
      type: typeof item.type === 'string' ? item.type.trim().slice(0, 120) : undefined,
      size: typeof item.size === 'number' && Number.isFinite(item.size) && item.size >= 0 ? item.size : undefined,
    }));
}

function parseStoredAttachments(raw: string | null, req: NextRequest) {
  if (!raw) return null;

  try {
    return normalizeResponseAttachments(JSON.parse(raw), req);
  } catch {
    return null;
  }
}

// GET /api/conversations/[id]/messages
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.userId;

  const { id } = await params;
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId } },
  });
  if (!participant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  });

  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId: id, userId } },
    data: { unreadCount: 0 },
  });

  emitRealtimeEvents([
    eventForUser(userId, 'conversation.updated', id, { conversationId: id }),
  ]);

  const result = messages.map((message) => ({
    ...message,
    attachments: parseStoredAttachments(message.attachments, req),
  }));

  return NextResponse.json(result);
}

// POST /api/conversations/[id]/messages - send message
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.userId;
  const ip = getClientIp(req);

  const { id } = await params;
  const rateLimit = consumeRateLimit({
    key: `conversation-message:${id}:${userId}:${ip}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit, 'Cok hizli mesaj gonderiyorsunuz.');
  }

  const body = await req.json().catch(() => null);
  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  const attachments = normalizeStoredAttachments(parseAttachments(body?.attachments), req);

  if (!text && attachments.length === 0) {
    return NextResponse.json({ error: 'Mesaj veya ek gerekli' }, { status: 400 });
  }
  if (text.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: 'Mesaj cok uzun' }, { status: 400 });
  }
  if (Array.isArray(body?.attachments) && attachments.length !== body.attachments.length) {
    return NextResponse.json({ error: 'Gecersiz ek bilgisi gonderildi' }, { status: 400 });
  }

  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId } },
  });
  if (!participant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const message = await prisma.message.create({
    data: {
      conversationId: id,
      senderId: userId,
      text,
      attachments: attachments.length > 0 ? JSON.stringify(attachments) : null,
    },
    include: { sender: { select: { id: true, name: true } } },
  });

  await prisma.conversationParticipant.updateMany({
    where: { conversationId: id, userId: { not: userId } },
    data: { unreadCount: { increment: 1 } },
  });
  await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });

  const recipients = await prisma.conversationParticipant.findMany({
    where: { conversationId: id, userId: { not: userId } },
    select: { userId: true },
  });

  emitRealtimeEvents([
    eventForUser(userId, 'conversation.updated', id, { conversationId: id }),
    ...recipients.flatMap((recipient) => ([
      eventForUser(recipient.userId, 'message.created', message.id, { conversationId: id }),
      eventForUser(recipient.userId, 'conversation.updated', id, { conversationId: id }),
    ])),
  ]);

  const pushBody = text || (attachments.length > 0 ? `Ek: ${attachments[0].name || 'Dosya gonderildi'}` : 'Yeni mesaj');

  await Promise.all(
    recipients.map((recipient) =>
      sendPushToUser(recipient.userId, {
        title: message.sender.name,
        body: pushBody,
        data: {
          conversationId: id,
          link: `/messages?conversation=${id}`,
        },
      }),
    ),
  );

  return NextResponse.json({
    ...message,
    attachments: normalizeResponseAttachments(attachments, req),
  }, { status: 201 });
}
