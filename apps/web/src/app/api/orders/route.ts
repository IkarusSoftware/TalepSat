import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/orders — list accepted/completed offers as orders
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;

  const orders = await prisma.offer.findMany({
    where: {
      status: { in: ['accepted', 'completed'] },
      OR: [
        { listing: { buyerId: userId } },
        { sellerId: userId },
      ],
    },
    include: {
      listing: {
        select: {
          id: true, title: true, category: true, city: true, buyerId: true,
          buyer: { select: { id: true, name: true, verified: true } },
        },
      },
      seller: {
        select: { id: true, name: true, score: true, verified: true, image: true },
      },
      reviews: { select: { id: true, rating: true, reviewerId: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const result = orders.map((o) => ({
    id: o.id,
    price: o.price,
    deliveryDays: o.deliveryDays,
    status: o.status,
    buyerConfirmed: o.buyerConfirmed,
    sellerConfirmed: o.sellerConfirmed,
    completedAt: o.completedAt,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    listingId: o.listing.id,
    listingTitle: o.listing.title,
    listingCategory: o.listing.category,
    listingCity: o.listing.city,
    isBuyer: o.listing.buyerId === userId,
    buyerId: o.listing.buyerId,
    sellerId: o.seller.id,
    sellerName: o.seller.name,
    sellerScore: o.seller.score,
    sellerVerified: o.seller.verified,
    buyerName: o.listing.buyer.name,
    buyerVerified: o.listing.buyer.verified,
    hasMyReview: o.reviews.some((r) => r.reviewerId === userId),
    myReviewRating: o.reviews.find((r) => r.reviewerId === userId)?.rating ?? null,
    totalReviews: o.reviews.length,
  }));

  return NextResponse.json(result);
}
