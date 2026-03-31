import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signMobileToken } from '@/lib/mobile-auth';
import { getSettingsDirect } from '@/lib/site-settings';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'E-posta ve şifre gerekli.' }, { status: 400 });
    }

    const [settings, user] = await Promise.all([
      getSettingsDirect(),
      prisma.user.findUnique({ where: { email } }),
    ]);
    if (!user || !user.hashedPassword) {
      return NextResponse.json({ error: 'E-posta veya şifre hatalı.' }, { status: 401 });
    }

    if (user.status === 'banned') {
      return NextResponse.json({ error: 'Hesabınız yasaklanmıştır.' }, { status: 403 });
    }
    if (user.status === 'suspended') {
      return NextResponse.json({ error: 'Hesabınız askıya alınmıştır.' }, { status: 403 });
    }
    if (settings.email_verification_required && user.role !== 'admin' && !user.verified) {
      return NextResponse.json({ error: 'Giriş yapmadan önce hesabınızı doğrulamanız gerekiyor.' }, { status: 403 });
    }

    const valid = await bcrypt.compare(password, user.hashedPassword);
    if (!valid) {
      return NextResponse.json({ error: 'E-posta veya şifre hatalı.' }, { status: 401 });
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
        bio: user.bio,
        score: user.score,
        completedDeals: user.completedDeals,
      },
    });
  } catch (err) {
    console.error('Mobile login error:', err);
    return NextResponse.json({ error: 'Bir hata oluştu.' }, { status: 500 });
  }
}
