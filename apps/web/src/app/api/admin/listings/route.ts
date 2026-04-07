import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/admin-session';

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'all';
  const limit = parseInt(searchParams.get('limit') || '100', 10);

  const where: Record<string, unknown> = {};

  if (search) {
    where.title = { contains: search };
  }

  if (status !== 'all') {
    where.status = status;
  }

  const listings = await prisma.listing.findMany({
    where,
    select: {
      id: true,
      title: true,
      category: true,
      city: true,
      budgetMin: true,
      budgetMax: true,
      status: true,
      createdAt: true,
      buyer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: { offers: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return NextResponse.json(
    listings.map((listing) => ({
      id: listing.id,
      title: listing.title,
      category: listing.category,
      city: listing.city,
      budgetMin: listing.budgetMin,
      budgetMax: listing.budgetMax,
      status: listing.status,
      createdAt: listing.createdAt,
      buyerId: listing.buyer.id,
      buyerName: listing.buyer.name,
      buyerEmail: listing.buyer.email,
      offerCount: listing._count.offers,
    })),
  );
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const body = await req.json();
  const { listingId, action } = body as { listingId?: string; action?: string };

  if (!listingId || !action) {
    return NextResponse.json({ error: 'listingId ve action gerekli' }, { status: 400 });
  }

  switch (action) {
    case 'approve': {
      const approved = await prisma.listing.update({ where: { id: listingId }, data: { status: 'active' } });
      await prisma.notification.create({
        data: {
          userId: approved.buyerId,
          type: 'listing_approved',
          title: 'Ilaniniz Onaylandi',
          description: `"${approved.title}" ilani onaylandi ve yayina alindi. Saticilar artik teklif gonderebilir.`,
          link: `/listing/${approved.id}`,
        },
      });
      break;
    }
    case 'reject': {
      const rejected = await prisma.listing.update({ where: { id: listingId }, data: { status: 'rejected' } });
      await prisma.notification.create({
        data: {
          userId: rejected.buyerId,
          type: 'listing_rejected',
          title: 'Ilaniniz Reddedildi',
          description: `"${rejected.title}" ilani inceleme sonucunda yayinlanamadi. Detaylar icin destek ekibiyle iletisime gecin.`,
          link: '/dashboard',
        },
      });
      break;
    }
    case 'expire':
      await prisma.listing.update({ where: { id: listingId }, data: { status: 'expired' } });
      break;
    default:
      return NextResponse.json({ error: 'Gecersiz aksiyon' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
