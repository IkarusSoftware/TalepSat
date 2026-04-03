import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-session';
import { prisma } from '@/lib/prisma';
import { consumeRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/security';

// POST /api/users/[id]/block - toggle block
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.userId;

  const rateLimit = consumeRateLimit({
    key: `user-block:${userId}:${getClientIp(req)}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit, 'Cok sik engelleme islemi yapiyorsunuz.');
  }

  const { id: blockedId } = await params;
  if (blockedId === userId) {
    return NextResponse.json({ error: 'Kendinizi engelleyemezsiniz' }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: blockedId },
    select: { id: true },
  });
  if (!targetUser) {
    return NextResponse.json({ error: 'Kullanici bulunamadi' }, { status: 404 });
  }

  const existing = await prisma.userBlock.findUnique({
    where: { blockerId_blockedId: { blockerId: userId, blockedId } },
  });

  if (existing) {
    await prisma.userBlock.delete({
      where: { blockerId_blockedId: { blockerId: userId, blockedId } },
    });
    return NextResponse.json({ blocked: false });
  }

  await prisma.userBlock.create({
    data: { blockerId: userId, blockedId },
  });

  return NextResponse.json({ blocked: true });
}

// GET /api/users/[id]/block - check if blocked
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: blockedId } = await params;
  const block = await prisma.userBlock.findUnique({
    where: { blockerId_blockedId: { blockerId: session.userId, blockedId } },
  });

  return NextResponse.json({ blocked: !!block });
}
