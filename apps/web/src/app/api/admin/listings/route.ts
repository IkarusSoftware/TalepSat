import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== 'admin') {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'all';
  const limit  = parseInt(searchParams.get('limit') || '100');

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
    listings.map((l) => ({
      id: l.id,
      title: l.title,
      category: l.category,
      city: l.city,
      budgetMin: l.budgetMin,
      budgetMax: l.budgetMax,
      status: l.status,
      createdAt: l.createdAt,
      buyerId: l.buyer.id,
      buyerName: l.buyer.name,
      buyerEmail: l.buyer.email,
      offerCount: l._count.offers,
    }))
  );
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== 'admin') {
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
          title: 'İlanınız Onaylandı 🎉',
          description: `"${approved.title}" ilanınız onaylandı ve yayına alındı. Satıcılar artık teklif gönderebilir.`,
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
          title: 'İlanınız Reddedildi',
          description: `"${rejected.title}" ilanınız inceleme sonucunda yayınlanamadı. Detaylar için destek ekibiyle iletişime geçin.`,
          link: `/dashboard`,
        },
      });
      break;
    }
    case 'expire':
      await prisma.listing.update({ where: { id: listingId }, data: { status: 'expired' } });
      break;
    default:
      return NextResponse.json({ error: 'Geçersiz aksiyon' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
