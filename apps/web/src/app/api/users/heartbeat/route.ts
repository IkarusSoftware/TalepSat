import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-session';
import { prisma } from '@/lib/prisma';
import { eventForUser, emitRealtimeEvents } from '@/lib/realtime';

// POST /api/users/heartbeat — update lastSeen
export async function POST(req: NextRequest) {
  const session = await getApiSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.user.update({
    where: { id: session.userId },
    data: { lastSeen: new Date() },
  });

  const peers = await prisma.conversationParticipant.findMany({
    where: {
      userId: { not: session.userId },
      conversation: {
        participants: {
          some: {
            userId: session.userId,
          },
        },
      },
    },
    select: { userId: true },
    distinct: ['userId'],
  });

  emitRealtimeEvents(
    peers.map((peer) => eventForUser(peer.userId, 'presence.updated', session.userId)),
  );

  return NextResponse.json({ ok: true });
}
