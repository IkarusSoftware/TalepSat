import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/listings/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      buyer: { select: { id: true, name: true, score: true, verified: true, image: true, city: true, completedDeals: true, createdAt: true } },
      offers: {
        include: {
          seller: { select: { id: true, name: true, score: true, verified: true, badge: true, completedDeals: true, companyName: true, createdAt: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!listing) {
    return NextResponse.json({ error: 'İlan bulunamadı' }, { status: 404 });
  }

  // Increment view count
  await prisma.listing.update({ where: { id }, data: { viewCount: { increment: 1 } } });

  return NextResponse.json({
    ...listing,
    images: listing.images ? JSON.parse(listing.images) : [],
    offerCount: listing.offers.length,
    buyerName: listing.buyer.name,
    buyerInitials: listing.buyer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
    buyerScore: listing.buyer.score,
  });
}

// PATCH /api/listings/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return NextResponse.json({ error: 'İlan bulunamadı' }, { status: 404 });
  if (listing.buyerId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const updated = await prisma.listing.update({ where: { id }, data: body });
  return NextResponse.json(updated);
}

// DELETE /api/listings/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return NextResponse.json({ error: 'İlan bulunamadı' }, { status: 404 });
  if (listing.buyerId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await prisma.listing.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
