import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-session';
import { createNotificationAndPublish } from '@/lib/notification-service';
import { prisma } from '@/lib/prisma';
import { eventForUser, emitRealtimeEvents } from '@/lib/realtime';
import { getSettingsDirect } from '@/lib/site-settings';
import { consumeRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/security';

const MAX_NOTE_LENGTH = 2000;

function parsePrice(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 100) / 100;
}

function parseDeliveryDays(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 365) return null;
  return parsed;
}

// GET /api/offers - list offers for current user
export async function GET(req: NextRequest) {
  const session = await getApiSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role');
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
      seller: {
        select: {
          id: true,
          name: true,
          score: true,
          verified: true,
          badge: true,
          completedDeals: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const result = offers.map((offer) => ({
    ...offer,
    listingTitle: offer.listing.title,
    listingCategory: offer.listing.category,
    listingCity: offer.listing.city,
    sellerName: offer.seller.name,
    sellerInitials: offer.seller.name.split(' ').map((name: string) => name[0]).join('').toUpperCase().slice(0, 2),
    sellerScore: offer.seller.score,
    sellerVerified: offer.seller.verified,
    sellerBadge: offer.seller.badge,
    sellerCompletedDeals: offer.seller.completedDeals,
    sellerMemberSince: offer.seller.createdAt.toISOString(),
    buyerName: offer.listing.buyer.name,
    buyerVerified: offer.listing.buyer.verified,
  }));

  return NextResponse.json(result);
}

// POST /api/offers - create offer
export async function POST(req: NextRequest) {
  const session = await getApiSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rateLimit = consumeRateLimit({
    key: `offer-create:${session.userId}:${getClientIp(req)}`,
    limit: 15,
    windowMs: 60_000,
  });
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit, 'Cok sik teklif gonderiyorsunuz.');
  }

  const body = await req.json().catch(() => null);
  const listingId = typeof body?.listingId === 'string' ? body.listingId.trim() : '';
  const price = parsePrice(body?.price);
  const deliveryDays = parseDeliveryDays(body?.deliveryDays);
  const note = typeof body?.note === 'string' ? body.note.trim().slice(0, MAX_NOTE_LENGTH) : null;

  if (!listingId || !price || !deliveryDays) {
    return NextResponse.json({ error: 'Gecerli listing, fiyat ve teslim suresi gerekli' }, { status: 400 });
  }

  const settings = await getSettingsDirect();
  if (price < settings.offer_min_amount) {
    return NextResponse.json({
      error: `Minimum teklif tutari ${settings.offer_min_amount.toLocaleString('tr-TR')} TL olmali.`,
    }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return NextResponse.json({ error: 'Ilan bulunamadi' }, { status: 404 });
  if (listing.buyerId === session.userId) {
    return NextResponse.json({ error: 'Kendi ilaniniza teklif veremezsiniz' }, { status: 400 });
  }
  if (!['active', 'pending'].includes(listing.status)) {
    return NextResponse.json({ error: 'Bu ilana teklif verilemez' }, { status: 400 });
  }

  const existingOffer = await prisma.offer.findFirst({
    where: { listingId, sellerId: session.userId, status: 'pending' },
  });
  if (existingOffer) {
    return NextResponse.json({ error: 'Bu ilana zaten bekleyen bir teklifiniz var' }, { status: 400 });
  }

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
        error: `Aylik teklif limitinize ulastiniz (${plan.offersPerMonth} teklif).`,
        limitReached: true,
        limit: plan.offersPerMonth,
        used: monthlyOfferCount,
      }, { status: 403 });
    }
  }

  const offer = await prisma.offer.create({
    data: {
      listingId,
      sellerId: session.userId,
      price,
      deliveryDays,
      note,
    },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          score: true,
          verified: true,
          badge: true,
          completedDeals: true,
          companyName: true,
          createdAt: true,
        },
      },
    },
  });

  await createNotificationAndPublish({
    userId: listing.buyerId,
    type: 'offer_received',
    title: 'Yeni teklif aldiniz',
    description: `"${listing.title}" ilaniniza yeni bir teklif geldi.`,
    link: `/listing/${listing.id}`,
    entityId: offer.id,
  });

  emitRealtimeEvents([
    eventForUser(listing.buyerId, 'offer.updated', offer.id),
    eventForUser(session.userId, 'offer.updated', offer.id),
  ]);

  return NextResponse.json(offer, { status: 201 });
}
