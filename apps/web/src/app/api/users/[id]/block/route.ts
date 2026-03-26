import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/users/[id]/block — toggle block
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: blockedId } = await params;

  if (blockedId === session.user.id) {
    return NextResponse.json({ error: 'Kendini engelleyemezsin' }, { status: 400 });
  }

  // Check if already blocked
  const existing = await prisma.userBlock.findUnique({
    where: { blockerId_blockedId: { blockerId: session.user.id, blockedId } },
  });

  if (existing) {
    // Unblock
    await prisma.userBlock.delete({
      where: { blockerId_blockedId: { blockerId: session.user.id, blockedId } },
    });
    return NextResponse.json({ blocked: false });
  }

  // Block
  await prisma.userBlock.create({
    data: { blockerId: session.user.id, blockedId },
  });

  return NextResponse.json({ blocked: true });
}

// GET /api/users/[id]/block — check if blocked
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: blockedId } = await params;

  const block = await prisma.userBlock.findUnique({
    where: { blockerId_blockedId: { blockerId: session.user.id, blockedId } },
  });

  return NextResponse.json({ blocked: !!block });
}
