import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-session';
import { prisma } from '@/lib/prisma';

// GET /api/listings/favorites — current user's favorited listings
export async function GET(req: NextRequest) {
  const session = await getApiSession(req);
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.userId },
    include: {
      listing: {
        include: {
          buyer: { select: { id: true, name: true, score: true, verified: true, image: true, city: true } },
          _count: { select: { offers: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const result = favorites.map(({ listing: l }) => ({
    ...l,
    images: JSON.parse(l.images || '[]'),
    offerCount: l._count.offers,
    buyerName: l.buyer.name,
    buyerScore: l.buyer.score,
    buyerVerified: l.buyer.verified,
    buyerImage: l.buyer.image,
    buyerInitials: l.buyer.name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2),
  }));

  return NextResponse.json(result);
}
