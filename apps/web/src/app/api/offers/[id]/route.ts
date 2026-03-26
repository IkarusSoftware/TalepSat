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
      reviews: {
        include: {
          reviewer: { select: { id: true, name: true } },
        },
      },
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

  // Seller can edit their pending offer
  if (action === 'edit' && offer.sellerId === session.user.id && offer.status === 'pending') {
    const updateData: Record<string, unknown> = {};
    if (body.price) updateData.price = parseFloat(body.price);
    if (body.deliveryDays) updateData.deliveryDays = parseInt(body.deliveryDays);
    if (body.note !== undefined) updateData.note = body.note || null;
    const updated = await prisma.offer.update({
      where: { id },
      data: updateData,
      include: {
        listing: {
          include: {
            buyer: { select: { id: true, name: true, score: true, verified: true } },
          },
        },
        seller: { select: { id: true, name: true, score: true, verified: true, badge: true, completedDeals: true, companyName: true, createdAt: true, city: true } },
      },
    });
    return NextResponse.json(updated);
  }

  // Confirm delivery (both buyer and seller must confirm) — before buyerId check
  if (action === 'confirm') {
    if (offer.status !== 'accepted') {
      return NextResponse.json({ error: 'Sadece kabul edilmiş siparişler onaylanabilir' }, { status: 400 });
    }

    const isBuyerOfOffer = offer.listing.buyerId === session.user.id;
    const isSellerOfOffer = offer.sellerId === session.user.id;

    if (!isBuyerOfOffer && !isSellerOfOffer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (isBuyerOfOffer) updateData.buyerConfirmed = true;
    if (isSellerOfOffer) updateData.sellerConfirmed = true;

    // Check if both will be confirmed after this update
    const willBuyerConfirm = isBuyerOfOffer ? true : offer.buyerConfirmed;
    const willSellerConfirm = isSellerOfOffer ? true : offer.sellerConfirmed;
    const bothConfirmed = willBuyerConfirm && willSellerConfirm;

    if (bothConfirmed) {
      updateData.status = 'completed';
      updateData.completedAt = new Date();
    }

    const updated = await prisma.offer.update({
      where: { id },
      data: updateData,
      include: {
        listing: {
          include: {
            buyer: { select: { id: true, name: true, score: true, verified: true } },
          },
        },
        seller: { select: { id: true, name: true, score: true, verified: true, badge: true, completedDeals: true, companyName: true, createdAt: true, city: true } },
        reviews: { include: { reviewer: { select: { id: true, name: true } } } },
      },
    });

    // Notify the other party
    const notifyUserId = isBuyerOfOffer ? offer.sellerId : offer.listing.buyerId;
    const confirmerRole = isBuyerOfOffer ? 'Alıcı' : 'Satıcı';

    if (bothConfirmed) {
      // Both confirmed — order is complete
      await prisma.user.update({
        where: { id: offer.sellerId },
        data: { completedDeals: { increment: 1 } },
      });
      await prisma.listing.update({
        where: { id: offer.listingId },
        data: { status: 'completed' },
      });
      // Notify both
      await prisma.notification.createMany({
        data: [
          {
            userId: offer.sellerId,
            type: 'system',
            title: 'Sipariş Tamamlandı',
            description: `"${offer.listing.title}" siparişi başarıyla tamamlandı.`,
            link: `/orders`,
          },
          {
            userId: offer.listing.buyerId,
            type: 'system',
            title: 'Sipariş Tamamlandı',
            description: `"${offer.listing.title}" siparişi tamamlandı. Satıcıyı değerlendirmeyi unutmayın!`,
            link: `/orders`,
          },
        ],
      });
    } else {
      await prisma.notification.create({
        data: {
          userId: notifyUserId,
          type: 'system',
          title: `${confirmerRole} Teslimatı Onayladı`,
          description: `"${offer.listing.title}" siparişi için ${confirmerRole.toLowerCase()} teslimatı onayladı. Siz de onaylayın.`,
          link: `/orders`,
        },
      });
    }

    return NextResponse.json(updated);
  }

  const isBuyerOfListing = offer.listing.buyerId === session.user.id;
  const isSellerOfOffer = offer.sellerId === session.user.id;

  // Seller can accept/reject counter-offer from buyer
  if (isSellerOfOffer && offer.status === 'counter_offered') {
    if (action === 'accept') {
      // Seller accepts buyer's counter-offer → update price/days and mark accepted
      const updateData: Record<string, unknown> = { status: 'accepted' };
      if (offer.counterPrice) updateData.price = offer.counterPrice;
      if (offer.counterDays) updateData.deliveryDays = offer.counterDays;
      const updated = await prisma.offer.update({ where: { id }, data: updateData });
      await prisma.notification.create({
        data: {
          userId: offer.listing.buyerId,
          type: 'offer_accepted',
          title: 'Karşı Teklifiniz Kabul Edildi',
          description: `"${offer.listing.title}" ilanındaki karşı teklifiniz satıcı tarafından kabul edildi.`,
          link: `/offers/${offer.id}`,
        },
      });
      return NextResponse.json(updated);
    }

    if (action === 'reject') {
      const updated = await prisma.offer.update({ where: { id }, data: { status: 'rejected', rejectedReason: rejectedReason || 'Karşı teklif satıcı tarafından reddedildi' } });
      await prisma.notification.create({
        data: {
          userId: offer.listing.buyerId,
          type: 'offer_rejected',
          title: 'Satıcı Karşı Teklifinizi Reddetti',
          description: `"${offer.listing.title}" ilanındaki karşı teklifiniz reddedildi.`,
          link: `/offers/${offer.id}`,
        },
      });
      return NextResponse.json(updated);
    }

    // Seller revises their offer in response to counter
    if (action === 'edit') {
      const updateData: Record<string, unknown> = { status: 'pending', counterPrice: null, counterDays: null, counterNote: null, counterAt: null, revisionCount: { increment: 1 } };
      if (body.price) updateData.price = parseFloat(body.price);
      if (body.deliveryDays) updateData.deliveryDays = parseInt(body.deliveryDays);
      if (body.note !== undefined) updateData.note = body.note || null;
      const updated = await prisma.offer.update({ where: { id }, data: updateData });
      await prisma.notification.create({
        data: {
          userId: offer.listing.buyerId,
          type: 'offer_updated',
          title: 'Satıcı Teklifini Güncelledi',
          description: `"${offer.listing.title}" ilanındaki teklif satıcı tarafından revize edildi.`,
          link: `/offers/${offer.id}`,
        },
      });
      return NextResponse.json(updated);
    }
  }

  // Only listing owner (buyer) can accept/reject/counter from here
  if (!isBuyerOfListing) {
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
