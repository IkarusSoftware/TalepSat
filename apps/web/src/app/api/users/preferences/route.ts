import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-session';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getApiSession(req);
  if (!session?.userId) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      pushNotificationsEnabled: true,
    },
  });

  return NextResponse.json({
    push: Boolean(user?.pushNotificationsEnabled),
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getApiSession(req);
  if (!session?.userId) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (typeof body?.push !== 'boolean') {
    return NextResponse.json({ error: 'push boolean olarak gonderilmeli' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: {
      pushNotificationsEnabled: body.push,
    },
    select: {
      pushNotificationsEnabled: true,
    },
  });

  return NextResponse.json({
    push: user.pushNotificationsEnabled,
  });
}
