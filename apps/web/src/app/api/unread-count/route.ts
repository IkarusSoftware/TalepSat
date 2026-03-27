import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/unread-count — lightweight endpoint for header badges
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ messages: 0, notifications: 0 });

  const [msgAgg, notifCount] = await Promise.all([
    prisma.conversationParticipant.aggregate({
      where: { userId: session.user.id },
      _sum: { unreadCount: true },
    }),
    prisma.notification.count({
      where: { userId: session.user.id, read: false },
    }),
  ]);

  return NextResponse.json({
    messages: msgAgg._sum.unreadCount ?? 0,
    notifications: notifCount,
  });
}
