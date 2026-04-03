import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

const SECRET = process.env.AUTH_SECRET || 'talepsat-dev-secret-change-in-production-2026';

export type MobileTokenPayload = {
  sub: string;       // userId
  email: string;
  name: string;
  role: string;
  badge: string | null;
  verified: boolean;
};

export function signMobileToken(payload: MobileTokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: '30d' });
}

export function verifyMobileToken(token: string): MobileTokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as MobileTokenPayload;
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
