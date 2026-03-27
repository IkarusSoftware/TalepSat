import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password || typeof token !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Geçersiz veya süresi dolmuş bağlantı.' },
        { status: 400 }
      );
    }

    // Find a valid, unused, non-expired token
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Geçersiz veya süresi dolmuş bağlantı.' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password and mark token as used in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    return NextResponse.json(
      { message: 'Şifreniz başarıyla güncellendi.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[reset-password]', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu. Lütfen tekrar deneyin.' },
      { status: 500 }
    );
  }
}
