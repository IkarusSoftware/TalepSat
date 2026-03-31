import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-session';
import { prisma } from '@/lib/prisma';

// POST /api/users/[id]/block — toggle block
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.userId;

  const { id: blockedId } = await params;

  if (blockedId === userId) {
    return NextResponse.json({ error: 'Kendini engelleyemezsin' }, { status: 400 });
  }

  // Check if already blocked
  const existing = await prisma.userBlock.findUnique({
    where: { blockerId_blockedId: { blockerId: userId, blockedId } },
  });

  if (existing) {
    // Unblock
    await prisma.userBlock.delete({
      where: { blockerId_blockedId: { blockerId: userId, blockedId } },
    });
    return NextResponse.json({ blocked: false });
  }

  // Block
  await prisma.userBlock.create({
    data: { blockerId: userId, blockedId },
  });

  return NextResponse.json({ blocked: true });
}

// GET /api/users/[id]/block — check if blocked
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: blockedId } = await params;

  const block = await prisma.userBlock.findUnique({
    where: { blockerId_blockedId: { blockerId: session.userId, blockedId } },
  });

  return NextResponse.json({ blocked: !!block });
}
