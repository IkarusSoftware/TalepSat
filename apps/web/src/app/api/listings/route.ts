import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getSettingsDirect } from '@/lib/site-settings';

// GET /api/listings — list all or filter by user
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const buyerId = searchParams.get('buyerId');
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const city = searchParams.get('city');
  const search = searchParams.get('search');

  const where: Record<string, unknown> = {};
  if (buyerId) where.buyerId = buyerId;
  if (status) where.status = status;
  if (category) where.categorySlug = category;
  if (city) where.city = { contains: city };
  if (search) where.title = { contains: search };

  const listings = await prisma.listing.findMany({
    where,
    include: {
      buyer: { select: { id: true, name: true, score: true, verified: true, image: true, city: true } },
      _count: { select: { offers: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const result = listings.map((l) => ({
    ...l,
    images: l.images ? JSON.parse(l.images) : [],
    offerCount: l._count.offers,
    buyerName: l.buyer.name,
    buyerScore: l.buyer.score,
    buyerInitials: l.buyer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
  }));

  return NextResponse.json(result);
}

// POST /api/listings — create listing
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, category, categorySlug, budgetMin, budgetMax, city, deliveryUrgency, images, expiresInDays } = body;

  if (!title || !description || !category || !categorySlug || !budgetMin || !budgetMax || !city) {
    return NextResponse.json({ error: 'Gerekli alanlar eksik' }, { status: 400 });
  }

  // ── Site ayarları ──────────────────────────────────────────────────────────
  const settings = await getSettingsDirect();

  // Maksimum bütçe kontrolü
  if (parseFloat(budgetMax) > settings.listing_max_budget) {
    return NextResponse.json({
      error: `Maksimum bütçe ${settings.listing_max_budget.toLocaleString('tr-TR')} ₺ olabilir.`,
    }, { status: 400 });
  }

  // Maksimum görsel sayısı kontrolü
  if (images && Array.isArray(images) && images.length > settings.listing_max_images) {
    return NextResponse.json({
      error: `En fazla ${settings.listing_max_images} görsel yükleyebilirsiniz.`,
    }, { status: 400 });
  }
  // ───────────────────────────────────────────────────────────────────────────

  // ── Plan limit check (maxListings) ─────────────────────────────────────────
  const buyer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { badge: true },
  });
  const planSlug = buyer?.badge || 'free';
  const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });

  if (plan && plan.maxListings !== null) {
    const activeListingCount = await prisma.listing.count({
      where: { buyerId: session.user.id, status: { in: ['active', 'pending'] } },
    });

    if (activeListingCount >= plan.maxListings) {
      return NextResponse.json({
        error: `Aktif ilan limitinize ulaştınız (${plan.maxListings} ilan). Planınızı yükseltin.`,
        limitReached: true,
        limit: plan.maxListings,
        used: activeListingCount,
      }, { status: 403 });
    }
  }
  // ───────────────────────────────────────────────────────────────────────────

  // İlan süresi: istek varsa onu kullan, yoksa ayardan al
  const days = expiresInDays || settings.listing_default_days;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);

  // Onay gerekiyorsa status = 'pending', değilse 'active'
  const initialStatus = settings.listing_requires_approval ? 'pending' : 'active';

  const listing = await prisma.listing.create({
    data: {
      title,
      description,
      category,
      categorySlug,
      budgetMin: parseFloat(budgetMin),
      budgetMax: parseFloat(budgetMax),
      city,
      deliveryUrgency: deliveryUrgency || 'normal',
      images: images ? JSON.stringify(images) : null,
      expiresAt,
      status: initialStatus,
      buyerId: session.user.id,
    },
  });

  // Onay bekleniyorsa kullanıcıya bildirim gönder
  if (settings.listing_requires_approval) {
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: 'listing_pending',
        title: 'İlanınız İnceleniyor',
        description: `"${title}" ilanınız admin onayı bekliyor.`,
        link: `/listing/${listing.id}`,
      },
    });
  }

  return NextResponse.json(
    {
      ...listing,
      requiresApproval: settings.listing_requires_approval,
    },
    { status: 201 }
  );
}
