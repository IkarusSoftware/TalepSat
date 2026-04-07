import { NextRequest, NextResponse } from 'next/server';
import { normalizeResponseMediaUrl } from '@/lib/media';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signMobileToken } from '@/lib/mobile-auth';
import { getSettingsDirect } from '@/lib/site-settings';
import { consumeRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { getClientIp, normalizeEmail } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const ipLimit = consumeRateLimit({
      key: `mobile-register:ip:${ip}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
    if (!ipLimit.success) {
      return createRateLimitResponse(ipLimit, 'Kisa surede cok fazla kayit denemesi yapildi.');
    }

    const settings = await getSettingsDirect();
    if (!settings.registration_open) {
      return NextResponse.json({ error: 'Kayit su an kapalidir.' }, { status: 403 });
    }

    const { name, email, password, phone, role } = await req.json();
    const normalizedEmail = typeof email === 'string' ? normalizeEmail(email) : '';

    if (!name || !normalizedEmail || !password || !role) {
      return NextResponse.json({ error: 'Tum zorunlu alanlari doldurun.' }, { status: 400 });
    }

    if (!['buyer', 'seller', 'both'].includes(role)) {
      return NextResponse.json({ error: 'Gecersiz rol.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Sifre en az 8 karakter olmali.' }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: 'Bu e-posta zaten kayitli.' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        hashedPassword,
        phone: typeof phone === 'string' ? phone.trim() || null : null,
        role,
        verified: !settings.email_verification_required,
      },
    });

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      badge: user.badge,
      verified: user.verified,
      image: normalizeResponseMediaUrl(user.image, req),
      city: user.city,
      phone: user.phone,
      companyName: user.companyName,
      taxNumber: user.taxNumber,
      score: user.score,
      completedDeals: user.completedDeals,
    };

    if (settings.email_verification_required) {
      return NextResponse.json(
        {
          requiresVerification: true,
          message: 'Hesabiniz olusturuldu. Giris yapmadan once hesabinizin dogrulanmasi gerekiyor.',
          user: userPayload,
        },
        { status: 201 },
      );
    }

    const token = signMobileToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      badge: user.badge,
      verified: user.verified,
    });

    return NextResponse.json({ token, user: userPayload }, { status: 201 });
  } catch (err) {
    console.error('Mobile register error:', err);
    return NextResponse.json({ error: 'Bir hata olustu.' }, { status: 500 });
  }
}
