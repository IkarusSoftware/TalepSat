import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-session';
import { createNotificationAndPublish } from '@/lib/notification-service';
import { prisma } from '@/lib/prisma';
import { eventForUser, emitRealtimeEvents } from '@/lib/realtime';
import { getSettingsDirect } from '@/lib/site-settings';

// GET /api/offers — list offers for current user (as buyer or seller)
export async function GET(req: NextRequest) {
  const session = await getApiSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role'); // 'buyer' or 'seller'
  const status = searchParams.get('status');
  const listingId = searchParams.get('listingId');

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (listingId) where.listingId = listingId;

  if (role === 'seller') {
    where.sellerId = session.userId;
  } else if (role === 'buyer') {
    where.listing = { buyerId: session.userId };
  } else {
    // All offers related to user
    where.OR = [
      { sellerId: session.userId },
      { listing: { buyerId: session.userId } },
    ];
  }

  const offers = await prisma.offer.findMany({
    where,
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          category: true,
          city: true,
          buyerId: true,
          buyer: { select: { id: true, name: true, verified: true } },
        },
      },
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
    buyerName: o.listing.buyer.name,
    buyerVerified: o.listing.buyer.verified,
  }));

  return NextResponse.json(result);
}

// POST /api/offers — create offer
export async function POST(req: NextRequest) {
  const session = await getApiSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { listingId, price, deliveryDays, note } = body;

  if (!listingId || !price || !deliveryDays) {
    return NextResponse.json({ error: 'Gerekli alanlar eksik' }, { status: 400 });
  }

  // ── Site ayarları — min teklif tutarı ──────────────────────────────────────
  const settings = await getSettingsDirect();
  if (parseFloat(price) < settings.offer_min_amount) {
    return NextResponse.json({
      error: `Minimum teklif tutarı ${settings.offer_min_amount.toLocaleString('tr-TR')} ₺ olmalıdır.`,
    }, { status: 400 });
  }
  // ───────────────────────────────────────────────────────────────────────────

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return NextResponse.json({ error: 'İlan bulunamadı' }, { status: 404 });
  if (listing.buyerId === session.userId) {
    return NextResponse.json({ error: 'Kendi ilanınıza teklif veremezsiniz' }, { status: 400 });
  }

  // Check for existing pending offer from this seller
  const existingOffer = await prisma.offer.findFirst({
    where: { listingId, sellerId: session.userId, status: 'pending' },
  });
  if (existingOffer) {
    return NextResponse.json({ error: 'Bu ilana zaten bekleyen bir teklifiniz var' }, { status: 400 });
  }

  // ── Plan limit check (offersPerMonth) ──────────────────────────────────────
  const seller = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { badge: true },
  });
  const planSlug = seller?.badge || 'free';
  const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });

  if (plan && plan.offersPerMonth !== null) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyOfferCount = await prisma.offer.count({
      where: { sellerId: session.userId, createdAt: { gte: startOfMonth } },
    });

    if (monthlyOfferCount >= plan.offersPerMonth) {
      return NextResponse.json({
        error: `Aylık teklif limitinize ulaştınız (${plan.offersPerMonth} teklif). Planınızı yükseltin.`,
        limitReached: true,
        limit: plan.offersPerMonth,
        used: monthlyOfferCount,
      }, { status: 403 });
    }
  }
  // ───────────────────────────────────────────────────────────────────────────

  const offer = await prisma.offer.create({
    data: {
      listingId,
      sellerId: session.userId,
      price: parseFloat(price),
      deliveryDays: parseInt(deliveryDays),
      note: note || null,
    },
    include: {
      seller: { select: { id: true, name: true, score: true, verified: true, badge: true, completedDeals: true, companyName: true, createdAt: true } },
    },
  });

  // Create notification for listing owner
  await createNotificationAndPublish({
    userId: listing.buyerId,
    type: 'offer_received',
    title: 'Yeni Teklif Aldınız',
    description: `"${listing.title}" ilanınıza yeni bir teklif geldi.`,
    link: `/listing/${listing.id}`,
    entityId: offer.id,
  });

  emitRealtimeEvents([
    eventForUser(listing.buyerId, 'offer.updated', offer.id),
    eventForUser(session.userId, 'offer.updated', offer.id),
  ]);

  return NextResponse.json(offer, { status: 201 });
}
