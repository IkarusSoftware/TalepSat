import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { message: 'Eğer bu e-posta kayıtlıysa sıfırlama bağlantısı gönderildi.' },
        { status: 200 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

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
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    const devResetUrl = `/reset-password?token=${token}`;

    // In production you would send an email here with the reset link.
    // For now we return the URL in dev so the developer can test.
    const isDev = process.env.NODE_ENV === 'development';

    return NextResponse.json(
      {
        message: 'Eğer bu e-posta kayıtlıysa sıfırlama bağlantısı gönderildi.',
        ...(isDev && { devResetUrl }),
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
