import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signMobileToken } from '@/lib/mobile-auth';
import { getSettingsDirect } from '@/lib/site-settings';
import { getBlockedUserMessage, isActiveUserStatus } from '@/lib/user-status';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'E-posta ve sifre gerekli.' }, { status: 400 });
    }

    const [settings, user] = await Promise.all([
      getSettingsDirect(),
      prisma.user.findUnique({ where: { email } }),
    ]);

    if (!user || !user.hashedPassword) {
      return NextResponse.json({ error: 'E-posta veya sifre hatali.' }, { status: 401 });
    }

    if (!isActiveUserStatus(user.status)) {
      return NextResponse.json({ error: getBlockedUserMessage(user.status) }, { status: 403 });
    }

    if (settings.email_verification_required && user.role !== 'admin' && !user.verified) {
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
        image: user.image,
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
