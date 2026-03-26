import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/offers/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const offer = await prisma.offer.findUnique({
    where: { id },
    include: {
      listing: {
        include: {
          buyer: { select: { id: true, name: true, score: true, verified: true } },
        },
      },
      seller: { select: { id: true, name: true, score: true, verified: true, badge: true, completedDeals: true, companyName: true, createdAt: true, city: true } },
    },
  });

  if (!offer) return NextResponse.json({ error: 'Teklif bulunamadı' }, { status: 404 });
  return NextResponse.json(offer);
}

// PATCH /api/offers/[id] — accept, reject, counter, withdraw
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const offer = await prisma.offer.findUnique({
    where: { id },
    include: { listing: true },
  });
  if (!offer) return NextResponse.json({ error: 'Teklif bulunamadı' }, { status: 404 });

  const body = await req.json();
  const { action, rejectedReason, counterPrice, counterDays, counterNote } = body;

  // Seller can withdraw their own offer
  if (action === 'withdraw' && offer.sellerId === session.user.id) {
    const updated = await prisma.offer.update({ where: { id }, data: { status: 'withdrawn' } });
    return NextResponse.json(updated);
  }

  // Only listing owner can accept/reject/counter
  if (offer.listing.buyerId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (action === 'accept') {
    const updated = await prisma.offer.update({ where: { id }, data: { status: 'accepted' } });
    await prisma.notification.create({
      data: {
        userId: offer.sellerId,
        type: 'offer_accepted',
        title: 'Teklifiniz Kabul Edildi',
        description: `"${offer.listing.title}" ilanındaki teklifiniz kabul edildi.`,
        link: `/offers/${offer.id}`,
      },
    });
    return NextResponse.json(updated);
  }

  if (action === 'reject') {
    const updated = await prisma.offer.update({ where: { id }, data: { status: 'rejected', rejectedReason } });
    await prisma.notification.create({
      data: {
        userId: offer.sellerId,
        type: 'offer_rejected',
        title: 'Teklifiniz Reddedildi',
        description: `"${offer.listing.title}" ilanındaki teklifiniz reddedildi.`,
        link: `/offers/${offer.id}`,
      },
    });
    return NextResponse.json(updated);
  }

  if (action === 'counter') {
    const updated = await prisma.offer.update({
      where: { id },
      data: {
        status: 'counter_offered',
        counterPrice: counterPrice ? parseFloat(counterPrice) : null,
        counterDays: counterDays ? parseInt(counterDays) : null,
        counterNote,
        counterAt: new Date(),
        revisionCount: { increment: 1 },
      },
    });
    await prisma.notification.create({
      data: {
        userId: offer.sellerId,
        type: 'counter_offer',
        title: 'Karşı Teklif Aldınız',
        description: `"${offer.listing.title}" ilanındaki teklifinize karşı teklif yapıldı.`,
        link: `/offers/${offer.id}`,
      },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 });
}
