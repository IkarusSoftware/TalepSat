import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { consumeRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { getClientIp, hashOpaqueToken } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    const ip = getClientIp(req);

    if (!token || !password || typeof token !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Geçersiz veya süresi dolmuş bağlantı.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Yeni sifre en az 8 karakter olmali.' },
        { status: 400 }
      );
    }

    const ipLimit = consumeRateLimit({
      key: `reset-password:ip:${ip}`,
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (!ipLimit.success) {
      return createRateLimitResponse(ipLimit, 'Cok fazla sifre guncelleme denemesi yapildi.');
    }

    const tokenHash = hashOpaqueToken(token);

    // Find a valid, unused, non-expired token
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        OR: [
          { token: tokenHash },
          { token },
        ],
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
      prisma.passwordResetToken.updateMany({
        where: { userId: resetToken.userId, used: false },
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
