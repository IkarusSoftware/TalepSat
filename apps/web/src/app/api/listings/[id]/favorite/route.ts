import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/listings/[id]/favorite — toggle favorite
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: listingId } = await params;
  const userId = session.user.id;

  const existing = await prisma.favorite.findUnique({
    where: { userId_listingId: { userId, listingId } },
  });

  if (existing) {
    await prisma.favorite.delete({
      where: { userId_listingId: { userId, listingId } },
    });
  } else {
    await prisma.favorite.create({
      data: { userId, listingId },
    });
  }

  const count = await prisma.favorite.count({ where: { listingId } });

  return NextResponse.json({ favorited: !existing, count });
}
