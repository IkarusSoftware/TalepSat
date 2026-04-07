import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { consumeRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { getClientIp, hashOpaqueToken, normalizeEmail } from '@/lib/security';
import { getSettingsDirect } from '@/lib/site-settings';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const ip = getClientIp(req);

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { message: 'Eğer bu e-posta kayıtlıysa sıfırlama bağlantısı gönderildi.' },
        { status: 200 }
      );
    }

    const normalizedEmail = normalizeEmail(email);
    const ipLimit = consumeRateLimit({
      key: `forgot-password:ip:${ip}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (!ipLimit.success) {
      return createRateLimitResponse(ipLimit, 'Cok fazla sifre sifirlama istegi gonderildi.');
    }

    const emailLimit = consumeRateLimit({
      key: `forgot-password:email:${normalizedEmail}`,
      limit: 3,
      windowMs: 30 * 60 * 1000,
    });
    if (!emailLimit.success) {
      return createRateLimitResponse(emailLimit, 'Bu e-posta icin gecici olarak cok fazla sifre sifirlama istegi alindi.');
    }

    const user = await prisma.user.findFirst({ where: { email: normalizedEmail } });

    // Always return 200 regardless of whether user exists (prevent email enumeration)
    if (!user) {
      return NextResponse.json(
        { message: 'Eğer bu e-posta kayıtlıysa sıfırlama bağlantısı gönderildi.' },
        { status: 200 }
      );
    }

    // Delete old tokens for this user
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    // Generate a new token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashOpaqueToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await prisma.passwordResetToken.create({
      data: {
        token: tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    const settings = await getSettingsDirect();
    const appBaseUrl = settings.site_url?.trim() || process.env.NEXTAUTH_URL?.trim() || req.nextUrl.origin;
    const resetUrl = new URL(`/reset-password?token=${token}`, appBaseUrl).toString();

    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    });

    const isDev = process.env.NODE_ENV === 'development';

    return NextResponse.json(
      {
        message: 'Eğer bu e-posta kayıtlıysa sıfırlama bağlantısı gönderildi.',
        ...(isDev && { devResetUrl: resetUrl }),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[forgot-password]', error);
    return NextResponse.json(
      { message: 'Eğer bu e-posta kayıtlıysa sıfırlama bağlantısı gönderildi.' },
      { status: 200 }
    );
  }
}
