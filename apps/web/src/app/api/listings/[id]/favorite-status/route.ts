import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/listings/[id]/favorite-status — check if current user has favorited this listing
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ favorited: false });
  }

  const { id: listingId } = await params;
  const userId = session.user.id;

  const existing = await prisma.favorite.findUnique({
    where: { userId_listingId: { userId, listingId } },
  });

  const count = await prisma.favorite.count({ where: { listingId } });

  return NextResponse.json({ favorited: !!existing, count });
}
