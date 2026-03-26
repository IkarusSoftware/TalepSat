import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/stats — public platform stats
export async function GET() {
  const [listings, completedDeals, verifiedSellers, totalReviews] = await Promise.all([
    prisma.listing.count({ where: { status: 'active' } }),
    prisma.offer.count({ where: { status: 'completed' } }),
    prisma.user.count({ where: { verified: true } }),
    prisma.review.count(),
  ]);

  // Calculate satisfaction from average review ratings
  const avgRating = await prisma.review.aggregate({ _avg: { rating: true } });
  const satisfaction = avgRating._avg.rating ? Math.round((avgRating._avg.rating / 5) * 100) : 95;

  return NextResponse.json({
    activeListings: listings,
    completedDeals,
    verifiedSellers,
    satisfaction,
  });
}
