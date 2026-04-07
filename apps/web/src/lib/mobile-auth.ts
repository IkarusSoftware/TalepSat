import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

const globalSecretStore = globalThis as typeof globalThis & {
  __talepsatMobileAuthDevSecret?: string;
};

function getMobileAuthSecret() {
  const configuredSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET or NEXTAUTH_SECRET must be configured for mobile auth in production.');
  }

  if (!globalSecretStore.__talepsatMobileAuthDevSecret) {
    globalSecretStore.__talepsatMobileAuthDevSecret = randomBytes(32).toString('hex');
  }

  return globalSecretStore.__talepsatMobileAuthDevSecret;
}

export type MobileTokenPayload = {
  sub: string;       // userId
  email: string;
  name: string;
  role: string;
  badge: string | null;
  verified: boolean;
};

export function signMobileToken(payload: MobileTokenPayload): string {
  return jwt.sign(payload, getMobileAuthSecret(), { expiresIn: '30d' });
}

export function verifyMobileToken(token: string): MobileTokenPayload | null {
  try {
    return jwt.verify(token, getMobileAuthSecret()) as MobileTokenPayload;
  } catch {
    return null;
  }
}

// API route'larında kullanmak için: cookie auth VEYA Bearer token
export async function getMobileSession(req: NextRequest): Promise<MobileTokenPayload | null> {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    return verifyMobileToken(token);
  }
  return null;
}

// Kullanıcıyı DB'den al (güncel bilgi için)
export async function getMobileUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      badge: true,
      verified: true,
      image: true,
      bio: true,
      city: true,
      phone: true,
      companyName: true,
      taxNumber: true,
      pushNotificationsEnabled: true,
      score: true,
      completedDeals: true,
      status: true,
      createdAt: true,
    },
  });
}
