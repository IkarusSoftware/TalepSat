import { NextRequest, NextResponse } from 'next/server';
import { normalizeResponseMediaUrl } from '@/lib/media';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signMobileToken } from '@/lib/mobile-auth';
import { getSettingsDirect } from '@/lib/site-settings';
import { getBlockedUserMessage, isActiveUserStatus } from '@/lib/user-status';
import { consumeRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { getClientIp, normalizeEmail } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const ip = getClientIp(req);

    if (!email || !password) {
      return NextResponse.json({ error: 'E-posta ve sifre gerekli.' }, { status: 400 });
    }

    const normalizedEmail = normalizeEmail(email);
    const ipLimit = consumeRateLimit({
      key: `mobile-login:ip:${ip}`,
      limit: 10,
      windowMs: 10 * 60 * 1000,
    });
    if (!ipLimit.success) {
      return createRateLimitResponse(ipLimit, 'Cok fazla giris denemesi yapildi.');
    }

    const emailLimit = consumeRateLimit({
      key: `mobile-login:email:${normalizedEmail}`,
      limit: 6,
      windowMs: 10 * 60 * 1000,
    });
    if (!emailLimit.success) {
      return createRateLimitResponse(emailLimit, 'Bu hesap icin gecici olarak cok fazla giris denemesi yapildi.');
    }

    const [settings, user] = await Promise.all([
      getSettingsDirect(),
      prisma.user.findFirst({ where: { email: normalizedEmail } }),
    ]);

    if (!user || !user.hashedPassword) {
      return NextResponse.json({ error: 'E-posta veya sifre hatali.' }, { status: 401 });
    }

    if (!isActiveUserStatus(user.status)) {
      return NextResponse.json({ error: getBlockedUserMessage(user.status) }, { status: 403 });
    }

    if (settings.email_verification_required && !user.verified) {
      return NextResponse.json(
        { error: 'Giris yapmadan once hesabinizi dogrulamaniz gerekiyor.' },
        { status: 403 },
      );
    }

    const valid = await bcrypt.compare(password, user.hashedPassword);
    if (!valid) {
      return NextResponse.json({ error: 'E-posta veya sifre hatali.' }, { status: 401 });
    }

    const token = signMobileToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      badge: user.badge,
      verified: user.verified,
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        badge: user.badge,
        verified: user.verified,
        image: normalizeResponseMediaUrl(user.image, req),
        city: user.city,
        bio: user.bio,
        phone: user.phone,
        companyName: user.companyName,
        taxNumber: user.taxNumber,
        score: user.score,
        completedDeals: user.completedDeals,
      },
    });
  } catch (err) {
    console.error('Mobile login error:', err);
    return NextResponse.json({ error: 'Bir hata olustu.' }, { status: 500 });
  }
}
