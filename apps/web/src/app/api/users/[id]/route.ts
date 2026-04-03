import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiSession } from '@/lib/api-session';
import { normalizeResponseMediaUrl, normalizeStoredMediaUrl } from '@/lib/media';

// GET /api/users/[id] — public profile
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getApiSession(req);
  const isSelf = session?.userId === id;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: isSelf,
      image: true,
      bio: true,
      city: true,
      phone: isSelf,
      companyName: true,
      taxNumber: isSelf,
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
    image: normalizeResponseMediaUrl(user.image, req),
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
  const fieldLimits: Record<string, number> = {
    name: 120,
    phone: 40,
    bio: 1500,
    city: 80,
    companyName: 140,
    taxNumber: 40,
    image: 2048,
  };
  const data: Record<string, string | null> = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      const value = body[field];
      if (value !== null && typeof value !== 'string') {
        return NextResponse.json({ error: `${field} alani gecersiz` }, { status: 400 });
      }

      const sanitized = typeof value === 'string' ? value.trim() : null;
      if (sanitized && sanitized.length > fieldLimits[field]) {
        return NextResponse.json({ error: `${field} alani cok uzun` }, { status: 400 });
      }

      if (field === 'image' && sanitized && !normalizeStoredMediaUrl(sanitized, req)) {
        return NextResponse.json({ error: 'image alani gecerli bir medya URL olmali' }, { status: 400 });
      }

      data[field] = field === 'image' && sanitized ? normalizeStoredMediaUrl(sanitized, req) : sanitized;
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

  return NextResponse.json({
    ...updated,
    image: normalizeResponseMediaUrl(updated.image, req),
  });
}
