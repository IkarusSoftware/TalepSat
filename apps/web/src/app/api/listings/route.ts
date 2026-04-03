import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-session';
import { normalizeResponseMediaUrl, normalizeResponseMediaUrls, normalizeStoredMediaUrls } from '@/lib/media';
import { prisma } from '@/lib/prisma';
import { getSettingsDirect } from '@/lib/site-settings';
import { consumeRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/security';

const MAX_TITLE_LENGTH = 160;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_CITY_LENGTH = 100;
const MAX_IMAGES = 10;
const ALLOWED_DELIVERY_URGENCY = new Set(['urgent', 'normal', 'flexible']);

function parseAmount(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 100) / 100;
}

function parseImages(value: unknown, req: NextRequest) {
  if (!Array.isArray(value)) return [];
  return normalizeStoredMediaUrls(value.slice(0, MAX_IMAGES), req);
}

// GET /api/listings - list all or filter by user
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const buyerId = searchParams.get('buyerId');
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const city = searchParams.get('city');
  const search = searchParams.get('search');
  const sort = searchParams.get('sort');

  const where: Record<string, unknown> = {};
  if (buyerId) where.buyerId = buyerId;
  if (status) where.status = status;
  if (category) where.categorySlug = category;
  if (city) where.city = { contains: city };
  if (search) where.title = { contains: search };

  const defaultOrder = { createdAt: 'desc' as const };
  const prismaOrderBy =
    sort === '-budgetMax'
      ? { budgetMax: 'desc' as const }
      : sort === 'expiresAt'
        ? { expiresAt: 'asc' as const }
        : defaultOrder;

  const listings = await prisma.listing.findMany({
    where,
    include: {
      buyer: { select: { id: true, name: true, score: true, verified: true, image: true, city: true } },
      _count: { select: { offers: true } },
    },
    orderBy: prismaOrderBy,
  });

  const result = listings.map((listing) => ({
    ...listing,
    images: normalizeResponseMediaUrls(listing.images ? JSON.parse(listing.images) : [], req),
    offerCount: listing._count.offers,
    buyerName: listing.buyer.name,
    buyerScore: listing.buyer.score,
    buyerVerified: listing.buyer.verified,
    buyerImage: normalizeResponseMediaUrl(listing.buyer.image, req),
    buyerInitials: listing.buyer.name.split(' ').map((name: string) => name[0]).join('').toUpperCase().slice(0, 2),
  }));

  if (sort === '-offerCount') {
    result.sort((a, b) => {
      if (b.offerCount !== a.offerCount) return b.offerCount - a.offerCount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } else if (!sort || sort === '-createdAt') {
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return NextResponse.json(result);
}

// POST /api/listings - create listing
export async function POST(req: NextRequest) {
  const session = await getApiSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimit = consumeRateLimit({
    key: `listing-create:${session.userId}:${getClientIp(req)}`,
    limit: 12,
    windowMs: 60_000,
  });
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit, 'Cok sik ilan olusturuyorsunuz.');
  }

  const body = await req.json().catch(() => null);
  const title = typeof body?.title === 'string' ? body.title.trim().slice(0, MAX_TITLE_LENGTH) : '';
  const description = typeof body?.description === 'string' ? body.description.trim().slice(0, MAX_DESCRIPTION_LENGTH) : '';
  const category = typeof body?.category === 'string' ? body.category.trim().slice(0, 120) : '';
  const categorySlug = typeof body?.categorySlug === 'string' ? body.categorySlug.trim().toLowerCase() : '';
  const city = typeof body?.city === 'string' ? body.city.trim().slice(0, MAX_CITY_LENGTH) : '';
  const budgetMin = parseAmount(body?.budgetMin);
  const budgetMax = parseAmount(body?.budgetMax);
  const deliveryUrgency =
    typeof body?.deliveryUrgency === 'string' && ALLOWED_DELIVERY_URGENCY.has(body.deliveryUrgency)
      ? body.deliveryUrgency
      : 'normal';
  const images = parseImages(body?.images, req);
  const requestedExpiresInDays = Number(body?.expiresInDays);

  if (!title || !description || !category || !categorySlug || !city || !budgetMin || !budgetMax) {
    return NextResponse.json({ error: 'Gerekli alanlar eksik veya gecersiz' }, { status: 400 });
  }
  if (!/^[a-z0-9-]{2,80}$/i.test(categorySlug)) {
    return NextResponse.json({ error: 'Gecersiz kategori slug' }, { status: 400 });
  }
  if (budgetMin > budgetMax) {
    return NextResponse.json({ error: 'Minimum butce maksimum butceden buyuk olamaz' }, { status: 400 });
  }
  if (Array.isArray(body?.images) && images.length !== body.images.length) {
    return NextResponse.json({ error: 'Gecersiz gorsel bilgisi gonderildi' }, { status: 400 });
  }

  const settings = await getSettingsDirect();
  if (budgetMax > settings.listing_max_budget) {
    return NextResponse.json({
      error: `Maksimum butce ${settings.listing_max_budget.toLocaleString('tr-TR')} TL olabilir.`,
    }, { status: 400 });
  }
  if (images.length > settings.listing_max_images) {
    return NextResponse.json({
      error: `En fazla ${settings.listing_max_images} gorsel yukleyebilirsiniz.`,
    }, { status: 400 });
  }

  const buyer = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { badge: true },
  });
  const planSlug = buyer?.badge || 'free';
  const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });

  if (plan && plan.maxListings !== null) {
    const activeListingCount = await prisma.listing.count({
      where: { buyerId: session.userId, status: { in: ['active', 'pending'] } },
    });

    if (activeListingCount >= plan.maxListings) {
      return NextResponse.json({
        error: `Aktif ilan limitinize ulastiniz (${plan.maxListings} ilan).`,
        limitReached: true,
        limit: plan.maxListings,
        used: activeListingCount,
      }, { status: 403 });
    }
  }

  const days = Number.isInteger(requestedExpiresInDays) && requestedExpiresInDays > 0 && requestedExpiresInDays <= 365
    ? requestedExpiresInDays
    : settings.listing_default_days;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);

  const initialStatus = settings.listing_requires_approval ? 'pending' : 'active';
  const listing = await prisma.listing.create({
    data: {
      title,
      description,
      category,
      categorySlug,
      budgetMin,
      budgetMax,
      city,
      deliveryUrgency,
      images: images.length > 0 ? JSON.stringify(images) : null,
      expiresAt,
      status: initialStatus,
      buyerId: session.userId,
    },
  });

  if (settings.listing_requires_approval) {
    await prisma.notification.create({
      data: {
        userId: session.userId,
        type: 'listing_pending',
        title: 'Ilaniniz inceleniyor',
        description: `"${title}" ilaniniz admin onayi bekliyor.`,
        link: `/listing/${listing.id}`,
      },
    });
  }

  return NextResponse.json(
    {
      ...listing,
      images,
      requiresApproval: settings.listing_requires_approval,
    },
    { status: 201 },
  );
}
