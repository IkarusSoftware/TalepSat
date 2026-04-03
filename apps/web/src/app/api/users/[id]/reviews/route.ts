import { NextRequest, NextResponse } from 'next/server';
import { normalizeResponseMediaUrl } from '@/lib/media';
import { prisma } from '@/lib/prisma';

// GET /api/users/[id]/reviews — get all reviews for a user
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const reviews = await prisma.review.findMany({
    where: { revieweeId: id },
    include: {
      reviewer: { select: { id: true, name: true, image: true } },
      offer: {
        select: {
          id: true,
          price: true,
          listing: { select: { id: true, title: true, category: true, city: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(
    reviews.map((review) => ({
      ...review,
      reviewer: {
        ...review.reviewer,
        image: normalizeResponseMediaUrl(review.reviewer.image, req),
      },
    })),
  );
}
