import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (expiresInDays || 30));

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
      buyerId: session.user.id,
    },
  });

  return NextResponse.json(listing, { status: 201 });
}
