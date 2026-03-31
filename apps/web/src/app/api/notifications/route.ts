import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-session';
import { prisma } from '@/lib/prisma';

// GET /api/notifications
export async function GET(req: NextRequest) {
  const session = await getApiSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json(notifications);
}

// PATCH /api/notifications - mark notifications as read
export async function PATCH(req: NextRequest) {
  const session = await getApiSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  if (body.markAllRead) {
    await prisma.notification.updateMany({
      where: { userId: session.userId, read: false },
      data: { read: true },
    });
    return NextResponse.json({ success: true });
  }

  if (body.id) {
    const result = await prisma.notification.updateMany({
      where: { id: body.id, userId: session.userId, read: false },
      data: { read: true },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Bildirim bulunamadi' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Gecersiz istek' }, { status: 400 });
}
