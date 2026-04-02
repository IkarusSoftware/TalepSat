import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-session';
import { prisma } from '@/lib/prisma';
import { createHash } from 'crypto';

function getVisitorHash(req: NextRequest): string {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
  const ua = req.headers.get('user-agent') || '';
  return createHash('sha256').update(`${ip}:${ua}`).digest('hex').slice(0, 16);
}

// GET /api/listings/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  // Track unique view
  const visitorHash = getVisitorHash(req);
  try {
    await prisma.listingView.create({
      data: { listingId: id, visitorHash },
    });
    // Also update the denormalized count
    await prisma.listing.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });
  } catch (e: unknown) {
    // Unique constraint violation = already viewed, ignore
    if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code !== 'P2002') {
      // Re-throw if it's not a unique constraint error
      throw e;
    }
  }

  // Get actual unique view count
  const uniqueViews = await prisma.listingView.count({ where: { listingId: id } });

  return NextResponse.json({
    ...listing,
    images: listing.images ? JSON.parse(listing.images) : [],
    viewCount: uniqueViews,
    offerCount: listing.offers.length,
    buyerName: listing.buyer.name,
    buyerInitials: listing.buyer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
    buyerScore: listing.buyer.score,
    buyerVerified: listing.buyer.verified,
    buyerImage: listing.buyer.image,
  });
}

// PATCH /api/listings/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession(req);
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return NextResponse.json({ error: 'İlan bulunamadı' }, { status: 404 });
  if (listing.buyerId !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const updated = await prisma.listing.update({ where: { id }, data: body });
  return NextResponse.json(updated);
}

// DELETE /api/listings/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession(req);
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return NextResponse.json({ error: 'İlan bulunamadı' }, { status: 404 });
  if (listing.buyerId !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await prisma.listing.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
