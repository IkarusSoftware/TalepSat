import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSettingsDirect } from '@/lib/site-settings';

export async function POST(req: NextRequest) {
  try {
    // Kayıt açık mı kontrol et
    const settings = await getSettingsDirect();
    if (!settings.registration_open) {
      return NextResponse.json(
        { error: 'Kayıt şu an kapalıdır. Lütfen daha sonra tekrar deneyin.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, password, phone, role } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Tüm zorunlu alanları doldurun.' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi zaten kayıtlı.' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
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
      return NextResponse.json(
        {
          requiresVerification: true,
          message: 'Hesabınız oluşturuldu. Giriş yapmadan önce hesabınızın doğrulanması gerekiyor.',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
        { status: 201 }
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
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu. Lütfen tekrar deneyin.' },
      { status: 500 }
    );
  }
}
