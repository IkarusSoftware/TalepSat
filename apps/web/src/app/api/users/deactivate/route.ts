import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getApiSession } from '@/lib/api-session';
import { prisma } from '@/lib/prisma';
import { unregisterPushDevice } from '@/lib/push';

export async function POST(req: NextRequest) {
  const session = await getApiSession(req);
  if (!session?.userId) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const currentPassword = body?.currentPassword;

  if (!currentPassword || typeof currentPassword !== 'string') {
    return NextResponse.json({ error: 'Mevcut sifren gerekli.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      hashedPassword: true,
      status: true,
    },
  });

  if (!user?.hashedPassword) {
    return NextResponse.json({ error: 'Bu hesap icin sifre dogrulamasi yapilamadi.' }, { status: 400 });
  }

  const isValid = await bcrypt.compare(currentPassword, user.hashedPassword);
  if (!isValid) {
    return NextResponse.json({ error: 'Mevcut sifre hatali.' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      status: 'deactivated',
      pushNotificationsEnabled: false,
    },
  });

  await unregisterPushDevice(session.userId);

  return NextResponse.json({ success: true });
}
