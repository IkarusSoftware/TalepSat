import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-session';
import { prisma } from '@/lib/prisma';

// POST /api/listings/[id]/favorite — toggle favorite
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getApiSession(req);
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: listingId } = await params;
  const userId = session.userId;

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
