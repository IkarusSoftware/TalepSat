import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSettingsDirect } from '@/lib/site-settings';
import { consumeRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { getClientIp, normalizeEmail } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const ipLimit = consumeRateLimit({
      key: `web-register:ip:${ip}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
    if (!ipLimit.success) {
      return createRateLimitResponse(ipLimit, 'Kisa surede cok fazla kayit denemesi yapildi.');
    }

    const settings = await getSettingsDirect();
    if (!settings.registration_open) {
      return NextResponse.json(
        { error: 'Kayit su an kapalidir. Lutfen daha sonra tekrar deneyin.' },
        { status: 403 },
      );
    }

    const body = await req.json();
    const normalizedEmail = typeof body?.email === 'string' ? normalizeEmail(body.email) : '';
    const { name, password, phone, role } = body ?? {};

    if (!name || !normalizedEmail || !password || !role) {
      return NextResponse.json({ error: 'Tum zorunlu alanlari doldurun.' }, { status: 400 });
    }

    if (!['buyer', 'seller', 'both'].includes(role)) {
      return NextResponse.json({ error: 'Gecersiz rol.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Sifre en az 8 karakter olmali.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({ where: { email: normalizedEmail } });
    if (existingUser) {
      return NextResponse.json({ error: 'Bu e-posta adresi zaten kayitli.' }, { status: 409 });
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

    if (settings.email_verification_required) {
      return NextResponse.json(
        {
          requiresVerification: true,
          message: 'Hesabiniz olusturuldu. Giris yapmadan once hesabinizin dogrulanmasi gerekiyor.',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
        { status: 201 },
      );
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Bir hata olustu. Lutfen tekrar deneyin.' },
      { status: 500 },
    );
  }
}
