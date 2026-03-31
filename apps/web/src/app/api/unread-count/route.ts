import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-session';
import { prisma } from '@/lib/prisma';

// GET /api/unread-count — lightweight endpoint for header badges
export async function GET(req: NextRequest) {
  const session = await getApiSession(req);
  if (!session) return NextResponse.json({ messages: 0, notifications: 0 });
  const userId = session.userId;

  const [msgAgg, notifCount] = await Promise.all([
    prisma.conversationParticipant.aggregate({
      where: { userId },
      _sum: { unreadCount: true },
    }),
    prisma.notification.count({
      where: { userId, read: false },
    }),
  ]);

  return NextResponse.json({
    messages: msgAgg._sum.unreadCount ?? 0,
    notifications: notifCount,
  });
}
