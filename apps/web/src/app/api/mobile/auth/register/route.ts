import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signMobileToken } from '@/lib/mobile-auth';
import { getSettingsDirect } from '@/lib/site-settings';

export async function POST(req: NextRequest) {
  try {
    const settings = await getSettingsDirect();
    if (!settings.registration_open) {
      return NextResponse.json({ error: 'Kayıt şu an kapalıdır.' }, { status: 403 });
    }

    const { name, email, password, phone, role } = await req.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Tüm zorunlu alanları doldurun.' }, { status: 400 });
    }

    if (!['buyer', 'seller', 'both'].includes(role)) {
      return NextResponse.json({ error: 'Geçersiz rol.' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Bu e-posta zaten kayıtlı.' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        phone: phone || null,
        role,
        verified: !settings.email_verification_required,
      },
    });

    if (settings.email_verification_required) {
      return NextResponse.json({
        requiresVerification: true,
        message: 'Hesabınız oluşturuldu. Giriş yapmadan önce hesabınızın doğrulanması gerekiyor.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          badge: user.badge,
          verified: user.verified,
          image: user.image,
          city: user.city,
          score: user.score,
          completedDeals: user.completedDeals,
        },
      }, { status: 201 });
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
        image: user.image,
        city: user.city,
        score: user.score,
        completedDeals: user.completedDeals,
      },
    }, { status: 201 });
  } catch (err) {
    console.error('Mobile register error:', err);
    return NextResponse.json({ error: 'Bir hata oluştu.' }, { status: 500 });
  }
}
