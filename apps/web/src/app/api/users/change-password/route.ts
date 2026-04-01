import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiSession } from '@/lib/api-session';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const session = await getApiSession(req);
  if (!session?.userId) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Mevcut ve yeni şifre gerekli' }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Yeni şifre en az 8 karakter olmalı' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { hashedPassword: true },
  });

  if (!user?.hashedPassword) {
    return NextResponse.json({ error: 'Şifre değiştirilemedi' }, { status: 400 });
  }

  const isValid = await bcrypt.compare(currentPassword, user.hashedPassword);
  if (!isValid) {
    return NextResponse.json({ error: 'Mevcut şifre hatalı' }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: session.userId },
    data: { hashedPassword },
  });

  return NextResponse.json({ success: true });
}
