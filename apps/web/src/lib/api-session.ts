/**
 * api-session.ts
 * Hem web (NextAuth) hem de mobil (JWT Bearer) auth'u destekleyen
 * merkezi session resolver. Tüm API route'larında kullan.
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { getMobileSession } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';
import { isActiveUserStatus } from '@/lib/user-status';

export type ApiSession = {
  userId: string;
  role: string;
  name: string;
  email: string;
  badge: string | null;
  verified: boolean;
};

async function resolveActiveUserSession(userId: string): Promise<ApiSession | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      name: true,
      email: true,
      badge: true,
      verified: true,
      status: true,
    },
  });

  if (!user || !isActiveUserStatus(user.status)) {
    return null;
  }

  return {
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    badge: user.badge,
    verified: user.verified,
  };
}

/**
 * Önce mobil JWT Bearer token'ı, sonra NextAuth session'ı kontrol eder.
 * İkisi de yoksa null döner.
 */
export async function getApiSession(req: NextRequest): Promise<ApiSession | null> {
  // 1. Mobil JWT Bearer token (Authorization: Bearer ...)
  const mobileSession = await getMobileSession(req);
  if (mobileSession) {
    return resolveActiveUserSession(mobileSession.sub);
  }

  // 2. NextAuth web session (cookie tabanlı)
  const session = await auth();
  if (session?.user?.id) {
    return resolveActiveUserSession(session.user.id);
  }

  return null;
}
