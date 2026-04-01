import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiSession } from '@/lib/api-session';

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

// PATCH /api/users/[id] — update own profile
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getApiSession(req);
  if (!session?.userId || session.userId !== id) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const body = await req.json();
  const allowedFields = ['name', 'phone', 'bio', 'city', 'companyName', 'taxNumber', 'image'];
  const data: Record<string, string> = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Güncellenecek alan bulunamadı' }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true, name: true, image: true, bio: true, city: true,
      companyName: true, taxNumber: true, phone: true, role: true,
      verified: true, badge: true,
    },
  });

  return NextResponse.json(updated);
}
