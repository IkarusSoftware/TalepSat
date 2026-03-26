import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/users/[id] — public profile
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: false,
      image: true,
      bio: true,
      city: true,
      companyName: true,
      taxNumber: false,
      verified: true,
      badge: true,
      score: true,
      completedDeals: true,
      role: true,
      createdAt: true,
      lastSeen: true,
    },
  });

  if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });

  // Get listing count for buyer
  const listingCount = await prisma.listing.count({ where: { buyerId: id } });

  // Get accepted offer count and accept rate for seller
  const totalOffers = await prisma.offer.count({ where: { sellerId: id } });
  const acceptedOffers = await prisma.offer.count({ where: { sellerId: id, status: { in: ['accepted', 'completed'] } } });
  const acceptRate = totalOffers > 0 ? Math.round((acceptedOffers / totalOffers) * 100) : 0;

  // Get review count
  const reviewCount = await prisma.review.count({ where: { revieweeId: id } });

  return NextResponse.json({
    ...user,
    listingCount,
    totalOffers,
    acceptedOffers,
    acceptRate,
    reviewCount,
  });
}
