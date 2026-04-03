import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-session';
import { normalizeResponseMediaUrl, normalizeResponseMediaUrls, normalizeStoredMediaUrls } from '@/lib/media';
import { prisma } from '@/lib/prisma';
import { consumeRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/security';

const MAX_TITLE_LENGTH = 160;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_CITY_LENGTH = 100;
const MAX_IMAGES = 10;
const ALLOWED_DELIVERY_URGENCY = new Set(['urgent', 'normal', 'flexible']);
const ALLOWED_STATUSES = new Set(['active', 'pending', 'expired', 'completed', 'rejected']);

function getVisitorHash(req: NextRequest): string {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
  const ua = req.headers.get('user-agent') || '';
  return createHash('sha256').update(`${ip}:${ua}`).digest('hex').slice(0, 16);
}

function parseImages(value: unknown, req: NextRequest) {
  if (!Array.isArray(value)) return [];
  return normalizeStoredMediaUrls(value.slice(0, MAX_IMAGES), req);
}

function parseAmount(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 100) / 100;
}

// GET /api/listings/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getApiSession(req);

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      buyer: {
        select: {
          id: true,
          name: true,
          score: true,
          verified: true,
          image: true,
          city: true,
          completedDeals: true,
          createdAt: true,
        },
      },
      offers: {
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
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!listing) {
    return NextResponse.json({ error: 'Ilan bulunamadi' }, { status: 404 });
  }

  const visitorHash = getVisitorHash(req);
  try {
    await prisma.listingView.create({
      data: { listingId: id, visitorHash },
    });
    await prisma.listing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  } catch (error: unknown) {
    if (!error || typeof error !== 'object' || !('code' in error) || (error as { code?: string }).code !== 'P2002') {
      throw error;
    }
  }

  const uniqueViews = await prisma.listingView.count({ where: { listingId: id } });
  const canSeeOffers = session?.userId === listing.buyerId;
  const visibleOffers = canSeeOffers ? listing.offers : [];
  const myOffer = session?.userId && session.userId !== listing.buyerId
    ? listing.offers.find((offer) => offer.sellerId === session.userId) ?? null
    : null;

  return NextResponse.json({
    ...listing,
    offers: visibleOffers,
    myOffer,
    images: normalizeResponseMediaUrls(listing.images ? JSON.parse(listing.images) : [], req),
    viewCount: uniqueViews,
    offerCount: listing.offers.length,
    buyerName: listing.buyer.name,
    buyerInitials: listing.buyer.name.split(' ').map((name: string) => name[0]).join('').toUpperCase().slice(0, 2),
    buyerScore: listing.buyer.score,
    buyerVerified: listing.buyer.verified,
    buyerImage: normalizeResponseMediaUrl(listing.buyer.image, req),
  });
}

// PATCH /api/listings/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession(req);
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return NextResponse.json({ error: 'Ilan bulunamadi' }, { status: 404 });
  if (listing.buyerId !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const rateLimit = consumeRateLimit({
    key: `listing-update:${id}:${session.userId}:${getClientIp(req)}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit, 'Cok sik ilan guncelliyorsunuz.');
  }

  const body = await req.json().catch(() => null);
  const updateData: Record<string, unknown> = {};

  if (body?.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      return NextResponse.json({ error: 'Gecerli baslik gerekli' }, { status: 400 });
    }
    updateData.title = body.title.trim().slice(0, MAX_TITLE_LENGTH);
  }

  if (body?.description !== undefined) {
    if (typeof body.description !== 'string' || !body.description.trim()) {
      return NextResponse.json({ error: 'Gecerli aciklama gerekli' }, { status: 400 });
    }
    updateData.description = body.description.trim().slice(0, MAX_DESCRIPTION_LENGTH);
  }

  if (body?.category !== undefined) {
    if (typeof body.category !== 'string' || !body.category.trim()) {
      return NextResponse.json({ error: 'Gecerli kategori gerekli' }, { status: 400 });
    }
    updateData.category = body.category.trim().slice(0, 120);
  }

  if (body?.categorySlug !== undefined) {
    if (typeof body.categorySlug !== 'string' || !/^[a-z0-9-]{2,80}$/i.test(body.categorySlug.trim())) {
      return NextResponse.json({ error: 'Gecerli kategori slug gerekli' }, { status: 400 });
    }
    updateData.categorySlug = body.categorySlug.trim().toLowerCase();
  }

  if (body?.budgetMin !== undefined) {
    const budgetMin = parseAmount(body.budgetMin);
    if (!budgetMin) return NextResponse.json({ error: 'Gecerli minimum butce gerekli' }, { status: 400 });
    updateData.budgetMin = budgetMin;
  }

  if (body?.budgetMax !== undefined) {
    const budgetMax = parseAmount(body.budgetMax);
    if (!budgetMax) return NextResponse.json({ error: 'Gecerli maksimum butce gerekli' }, { status: 400 });
    updateData.budgetMax = budgetMax;
  }

  if (
    (updateData.budgetMin !== undefined || updateData.budgetMax !== undefined) &&
    Number(updateData.budgetMin ?? listing.budgetMin) > Number(updateData.budgetMax ?? listing.budgetMax)
  ) {
    return NextResponse.json({ error: 'Minimum butce maksimum butceden buyuk olamaz' }, { status: 400 });
  }

  if (body?.city !== undefined) {
    if (typeof body.city !== 'string' || !body.city.trim()) {
      return NextResponse.json({ error: 'Gecerli sehir gerekli' }, { status: 400 });
    }
    updateData.city = body.city.trim().slice(0, MAX_CITY_LENGTH);
  }

  if (body?.deliveryUrgency !== undefined) {
    if (typeof body.deliveryUrgency !== 'string' || !ALLOWED_DELIVERY_URGENCY.has(body.deliveryUrgency)) {
      return NextResponse.json({ error: 'Gecersiz teslim aciliyeti' }, { status: 400 });
    }
    updateData.deliveryUrgency = body.deliveryUrgency;
  }

  if (body?.status !== undefined) {
    if (typeof body.status !== 'string' || !ALLOWED_STATUSES.has(body.status)) {
      return NextResponse.json({ error: 'Gecersiz ilan durumu' }, { status: 400 });
    }
    updateData.status = body.status;
  }

  if (body?.images !== undefined) {
    const images = parseImages(body.images, req);
    if (Array.isArray(body.images) && images.length !== body.images.length) {
      return NextResponse.json({ error: 'Gecersiz gorsel bilgisi gonderildi' }, { status: 400 });
    }
    updateData.images = images.length > 0 ? JSON.stringify(images) : null;
  }

  if (body?.expiresAt !== undefined) {
    const expiresAt = new Date(body.expiresAt);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
      return NextResponse.json({ error: 'Gecersiz bitis tarihi' }, { status: 400 });
    }
    updateData.expiresAt = expiresAt;
  }

  const updated = await prisma.listing.update({ where: { id }, data: updateData });
  return NextResponse.json({
    ...updated,
    images: normalizeResponseMediaUrls(updated.images ? JSON.parse(updated.images) : [], req),
  });
}

// DELETE /api/listings/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession(req);
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return NextResponse.json({ error: 'Ilan bulunamadi' }, { status: 404 });
  if (listing.buyerId !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const rateLimit = consumeRateLimit({
    key: `listing-delete:${id}:${session.userId}:${getClientIp(req)}`,
    limit: 10,
    windowMs: 60_000,
  });
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit, 'Cok sik ilan siliyorsunuz.');
  }

  await prisma.listing.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
