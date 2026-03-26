import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/offers — list offers for current user (as buyer or seller)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role'); // 'buyer' or 'seller'
  const status = searchParams.get('status');
  const listingId = searchParams.get('listingId');

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (listingId) where.listingId = listingId;

  if (role === 'seller') {
    where.sellerId = session.user.id;
  } else if (role === 'buyer') {
    where.listing = { buyerId: session.user.id };
  } else {
    // All offers related to user
    where.OR = [
      { sellerId: session.user.id },
      { listing: { buyerId: session.user.id } },
    ];
  }

  const offers = await prisma.offer.findMany({
    where,
    include: {
      listing: { select: { id: true, title: true, category: true, city: true, buyerId: true } },
      seller: { select: { id: true, name: true, score: true, verified: true, badge: true, completedDeals: true, createdAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const result = offers.map((o) => ({
    ...o,
    listingTitle: o.listing.title,
    listingCategory: o.listing.category,
    listingCity: o.listing.city,
    sellerName: o.seller.name,
    sellerInitials: o.seller.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
    sellerScore: o.seller.score,
    sellerVerified: o.seller.verified,
    sellerBadge: o.seller.badge,
    sellerCompletedDeals: o.seller.completedDeals,
    sellerMemberSince: o.seller.createdAt.toISOString(),
  }));

  return NextResponse.json(result);
}

// POST /api/offers — create offer
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { listingId, price, deliveryDays, note } = body;

  if (!listingId || !price || !deliveryDays) {
    return NextResponse.json({ error: 'Gerekli alanlar eksik' }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return NextResponse.json({ error: 'İlan bulunamadı' }, { status: 404 });
  if (listing.buyerId === session.user.id) {
    return NextResponse.json({ error: 'Kendi ilanınıza teklif veremezsiniz' }, { status: 400 });
  }

  // Check for existing pending offer from this seller
  const existingOffer = await prisma.offer.findFirst({
    where: {
      listingId,
      sellerId: session.user.id,
      status: 'pending'
    },
  });
  if (existingOffer) {
    return NextResponse.json({ error: 'Bu ilana zaten bekleyen bir teklifiniz var' }, { status: 400 });
  }

  const offer = await prisma.offer.create({
    data: {
      listingId,
      sellerId: session.user.id,
      price: parseFloat(price),
      deliveryDays: parseInt(deliveryDays),
      note: note || null,
    },
    include: {
      seller: { select: { id: true, name: true, score: true, verified: true, badge: true, completedDeals: true, companyName: true, createdAt: true } },
    },
  });

  // Create notification for listing owner
  await prisma.notification.create({
    data: {
      userId: listing.buyerId,
      type: 'offer_received',
      title: 'Yeni Teklif Aldınız',
      description: `"${listing.title}" ilanınıza yeni bir teklif geldi.`,
      link: `/listing/${listing.id}`,
    },
  });

  return NextResponse.json(offer, { status: 201 });
}
