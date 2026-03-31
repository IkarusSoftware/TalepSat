/**
 * api-session.ts
 * Hem web (NextAuth) hem de mobil (JWT Bearer) auth'u destekleyen
 * merkezi session resolver. Tüm API route'larında kullan.
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { getMobileSession } from '@/lib/mobile-auth';

export type ApiSession = {
  userId: string;
  role: string;
  name: string;
  email: string;
  badge: string | null;
  verified: boolean;
};

/**
 * Önce mobil JWT Bearer token'ı, sonra NextAuth session'ı kontrol eder.
 * İkisi de yoksa null döner.
 */
export async function getApiSession(req: NextRequest): Promise<ApiSession | null> {
  // 1. Mobil JWT Bearer token (Authorization: Bearer ...)
  const mobileSession = await getMobileSession(req);
  if (mobileSession) {
    return {
      userId:   mobileSession.sub,
      role:     mobileSession.role,
      name:     mobileSession.name,
      email:    mobileSession.email,
      badge:    mobileSession.badge,
      verified: mobileSession.verified,
    };
  }

  // 2. NextAuth web session (cookie tabanlı)
  const session = await auth();
  if (session?.user?.id) {
    const user = session.user as {
      id: string; role?: string; name?: string; email?: string;
      badge?: string; verified?: boolean;
    };
    return {
      userId:   user.id,
      role:     user.role     ?? 'buyer',
      name:     user.name     ?? '',
      email:    user.email    ?? '',
      badge:    user.badge    ?? null,
      verified: user.verified ?? false,
    };
  }

  return null;
}
