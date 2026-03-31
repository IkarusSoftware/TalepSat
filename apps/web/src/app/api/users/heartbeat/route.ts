import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-session';
import { prisma } from '@/lib/prisma';

// POST /api/users/heartbeat — update lastSeen
export async function POST(req: NextRequest) {
  const session = await getApiSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.user.update({
    where: { id: session.userId },
    data: { lastSeen: new Date() },
  });

  return NextResponse.json({ ok: true });
}
