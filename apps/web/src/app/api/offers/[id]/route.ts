import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-session';
import { createNotificationAndPublish } from '@/lib/notification-service';
import { prisma } from '@/lib/prisma';
import { eventForUser, emitRealtimeEvents } from '@/lib/realtime';
import { consumeRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/security';

const MAX_NOTE_LENGTH = 2000;
const MAX_REASON_LENGTH = 500;
const VALID_ACTIONS = new Set(['accept', 'reject', 'counter', 'withdraw', 'edit', 'confirm']);

function parsePrice(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 100) / 100;
}

function parseDeliveryDays(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 365) return null;
  return parsed;
}

function normalizeOptionalText(value: unknown, maxLength: number) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

async function getAuthorizedOffer(offerId: string, userId: string) {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      listing: {
        include: {
          buyer: { select: { id: true, name: true, score: true, verified: true } },
        },
      },
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
          city: true,
        },
      },
      reviews: {
        include: {
          reviewer: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!offer) return { offer: null, authorized: false };
  const authorized = offer.sellerId === userId || offer.listing.buyerId === userId;
  return { offer, authorized };
}

// GET /api/offers/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { offer, authorized } = await getAuthorizedOffer(id, session.userId);

  if (!offer) return NextResponse.json({ error: 'Teklif bulunamadi' }, { status: 404 });
  if (!authorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  return NextResponse.json(offer);
}

// PATCH /api/offers/[id] - accept, reject, counter, withdraw, edit, confirm
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const rateLimit = consumeRateLimit({
    key: `offer-action:${id}:${session.userId}:${getClientIp(req)}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit, 'Cok sik teklif islemi yapiyorsunuz.');
  }

  const { offer, authorized } = await getAuthorizedOffer(id, session.userId);
  if (!offer) return NextResponse.json({ error: 'Teklif bulunamadi' }, { status: 404 });
  if (!authorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const action = typeof body?.action === 'string' ? body.action.trim() : '';
  if (!VALID_ACTIONS.has(action)) {
    return NextResponse.json({ error: 'Gecersiz islem' }, { status: 400 });
  }

  const rejectedReason = normalizeOptionalText(body?.rejectedReason, MAX_REASON_LENGTH);
  const counterNote = normalizeOptionalText(body?.counterNote, MAX_NOTE_LENGTH);
  const note = normalizeOptionalText(body?.note, MAX_NOTE_LENGTH);
  const parsedPrice = body?.price !== undefined ? parsePrice(body.price) : null;
  const parsedDeliveryDays = body?.deliveryDays !== undefined ? parseDeliveryDays(body.deliveryDays) : null;
  const parsedCounterPrice = body?.counterPrice !== undefined ? parsePrice(body.counterPrice) : null;
  const parsedCounterDays = body?.counterDays !== undefined ? parseDeliveryDays(body.counterDays) : null;

  const isBuyerOfListing = offer.listing.buyerId === session.userId;
  const isSellerOfOffer = offer.sellerId === session.userId;

  if (action === 'withdraw') {
    if (!isSellerOfOffer || !['pending', 'counter_offered'].includes(offer.status)) {
      return NextResponse.json({ error: 'Bu teklif geri cekilemez' }, { status: 400 });
    }

    const updated = await prisma.offer.update({ where: { id }, data: { status: 'withdrawn' } });
    emitRealtimeEvents([
      eventForUser(offer.sellerId, 'offer.updated', offer.id),
      eventForUser(offer.listing.buyerId, 'offer.updated', offer.id),
    ]);
    return NextResponse.json(updated);
  }

  if (action === 'edit' && isSellerOfOffer && offer.status === 'pending') {
    if ((body?.price !== undefined && !parsedPrice) || (body?.deliveryDays !== undefined && !parsedDeliveryDays)) {
      return NextResponse.json({ error: 'Gecersiz fiyat veya teslim suresi' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (body?.price !== undefined) updateData.price = parsedPrice;
    if (body?.deliveryDays !== undefined) updateData.deliveryDays = parsedDeliveryDays;
    if (body?.note !== undefined) updateData.note = note;

    const updated = await prisma.offer.update({
      where: { id },
      data: updateData,
      include: {
        listing: {
          include: {
            buyer: { select: { id: true, name: true, score: true, verified: true } },
          },
        },
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
            city: true,
          },
        },
      },
    });
    emitRealtimeEvents([
      eventForUser(offer.sellerId, 'offer.updated', offer.id),
      eventForUser(offer.listing.buyerId, 'offer.updated', offer.id),
    ]);
    return NextResponse.json(updated);
  }

  if (action === 'confirm') {
    if (offer.status !== 'accepted') {
      return NextResponse.json({ error: 'Sadece kabul edilmis siparisler onaylanabilir' }, { status: 400 });
    }
    if (!isBuyerOfListing && !isSellerOfOffer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (isBuyerOfListing) updateData.buyerConfirmed = true;
    if (isSellerOfOffer) updateData.sellerConfirmed = true;

    const willBuyerConfirm = isBuyerOfListing ? true : offer.buyerConfirmed;
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
            city: true,
          },
        },
        reviews: { include: { reviewer: { select: { id: true, name: true } } } },
      },
    });

    const notifyUserId = isBuyerOfListing ? offer.sellerId : offer.listing.buyerId;
    const confirmerRole = isBuyerOfListing ? 'Alici' : 'Satici';

    if (bothConfirmed) {
      await prisma.user.update({
        where: { id: offer.sellerId },
        data: { completedDeals: { increment: 1 } },
      });
      await prisma.listing.update({
        where: { id: offer.listingId },
        data: { status: 'completed' },
      });
      await Promise.all([
        createNotificationAndPublish({
          userId: offer.sellerId,
          type: 'system',
          title: 'Siparis tamamlandi',
          description: `"${offer.listing.title}" siparisi basariyla tamamlandi.`,
          link: '/orders',
          entityId: offer.id,
        }),
        createNotificationAndPublish({
          userId: offer.listing.buyerId,
          type: 'system',
          title: 'Siparis tamamlandi',
          description: `"${offer.listing.title}" siparisi tamamlandi. Degerlendirme yapmayi unutmayin.`,
          link: '/orders',
          entityId: offer.id,
        }),
      ]);
    } else {
      await createNotificationAndPublish({
        userId: notifyUserId,
        type: 'system',
        title: `${confirmerRole} teslimati onayladi`,
        description: `"${offer.listing.title}" siparisi icin ${confirmerRole.toLowerCase()} teslimati onayladi.`,
        link: '/orders',
        entityId: offer.id,
      });
    }

    emitRealtimeEvents([
      eventForUser(offer.sellerId, 'order.updated', offer.id),
      eventForUser(offer.listing.buyerId, 'order.updated', offer.id),
      eventForUser(offer.sellerId, 'offer.updated', offer.id),
      eventForUser(offer.listing.buyerId, 'offer.updated', offer.id),
    ]);

    return NextResponse.json(updated);
  }

  if (isSellerOfOffer && offer.status === 'counter_offered') {
    if (action === 'accept') {
      const updateData: Record<string, unknown> = { status: 'accepted' };
      if (offer.counterPrice) updateData.price = offer.counterPrice;
      if (offer.counterDays) updateData.deliveryDays = offer.counterDays;

      const updated = await prisma.offer.update({ where: { id }, data: updateData });
      await createNotificationAndPublish({
        userId: offer.listing.buyerId,
        type: 'offer_accepted',
        title: 'Karsi teklif kabul edildi',
        description: `"${offer.listing.title}" ilanindaki karsi teklif kabul edildi.`,
        link: `/offers/${offer.id}`,
        entityId: offer.id,
      });
      emitRealtimeEvents([
        eventForUser(offer.sellerId, 'offer.updated', offer.id),
        eventForUser(offer.listing.buyerId, 'offer.updated', offer.id),
        eventForUser(offer.sellerId, 'order.updated', offer.id),
        eventForUser(offer.listing.buyerId, 'order.updated', offer.id),
      ]);
      return NextResponse.json(updated);
    }

    if (action === 'reject') {
      const updated = await prisma.offer.update({
        where: { id },
        data: { status: 'rejected', rejectedReason: rejectedReason || 'Karsi teklif satici tarafindan reddedildi' },
      });
      await createNotificationAndPublish({
        userId: offer.listing.buyerId,
        type: 'offer_rejected',
        title: 'Karsi teklif reddedildi',
        description: `"${offer.listing.title}" ilanindaki karsi teklif reddedildi.`,
        link: `/offers/${offer.id}`,
        entityId: offer.id,
      });
      emitRealtimeEvents([
        eventForUser(offer.sellerId, 'offer.updated', offer.id),
        eventForUser(offer.listing.buyerId, 'offer.updated', offer.id),
      ]);
      return NextResponse.json(updated);
    }

    if (action === 'edit') {
      if ((body?.price !== undefined && !parsedPrice) || (body?.deliveryDays !== undefined && !parsedDeliveryDays)) {
        return NextResponse.json({ error: 'Gecersiz fiyat veya teslim suresi' }, { status: 400 });
      }

      const updateData: Record<string, unknown> = {
        status: 'pending',
        counterPrice: null,
        counterDays: null,
        counterNote: null,
        counterAt: null,
        revisionCount: { increment: 1 },
      };
      if (body?.price !== undefined) updateData.price = parsedPrice;
      if (body?.deliveryDays !== undefined) updateData.deliveryDays = parsedDeliveryDays;
      if (body?.note !== undefined) updateData.note = note;

      const updated = await prisma.offer.update({ where: { id }, data: updateData });
      await createNotificationAndPublish({
        userId: offer.listing.buyerId,
        type: 'offer_updated',
        title: 'Teklif guncellendi',
        description: `"${offer.listing.title}" ilanindaki teklif revize edildi.`,
        link: `/offers/${offer.id}`,
        entityId: offer.id,
      });
      emitRealtimeEvents([
        eventForUser(offer.sellerId, 'offer.updated', offer.id),
        eventForUser(offer.listing.buyerId, 'offer.updated', offer.id),
      ]);
      return NextResponse.json(updated);
    }
  }

  if (!isBuyerOfListing) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!['pending', 'counter_offered'].includes(offer.status) && action !== 'confirm') {
    return NextResponse.json({ error: 'Bu teklif icin bu islem artik yapilamaz' }, { status: 400 });
  }

  if (action === 'accept') {
    const updated = await prisma.offer.update({ where: { id }, data: { status: 'accepted' } });
    await createNotificationAndPublish({
      userId: offer.sellerId,
      type: 'offer_accepted',
      title: 'Teklifiniz kabul edildi',
      description: `"${offer.listing.title}" ilanindaki teklifiniz kabul edildi.`,
      link: `/offers/${offer.id}`,
      entityId: offer.id,
    });
    emitRealtimeEvents([
      eventForUser(offer.sellerId, 'offer.updated', offer.id),
      eventForUser(offer.listing.buyerId, 'offer.updated', offer.id),
      eventForUser(offer.sellerId, 'order.updated', offer.id),
      eventForUser(offer.listing.buyerId, 'order.updated', offer.id),
    ]);
    return NextResponse.json(updated);
  }

  if (action === 'reject') {
    const updated = await prisma.offer.update({
      where: { id },
      data: { status: 'rejected', rejectedReason },
    });
    await createNotificationAndPublish({
      userId: offer.sellerId,
      type: 'offer_rejected',
      title: 'Teklifiniz reddedildi',
      description: `"${offer.listing.title}" ilanindaki teklifiniz reddedildi.`,
      link: `/offers/${offer.id}`,
      entityId: offer.id,
    });
    emitRealtimeEvents([
      eventForUser(offer.sellerId, 'offer.updated', offer.id),
      eventForUser(offer.listing.buyerId, 'offer.updated', offer.id),
    ]);
    return NextResponse.json(updated);
  }

  if (action === 'counter') {
    if (
      (body?.counterPrice !== undefined && !parsedCounterPrice) ||
      (body?.counterDays !== undefined && !parsedCounterDays)
    ) {
      return NextResponse.json({ error: 'Gecersiz karsi teklif bilgisi' }, { status: 400 });
    }
    if (!parsedCounterPrice && !parsedCounterDays && !counterNote) {
      return NextResponse.json({ error: 'En az bir karsi teklif alani gonderilmeli' }, { status: 400 });
    }

    const updated = await prisma.offer.update({
      where: { id },
      data: {
        status: 'counter_offered',
        counterPrice: parsedCounterPrice,
        counterDays: parsedCounterDays,
        counterNote,
        counterAt: new Date(),
        revisionCount: { increment: 1 },
      },
    });
    await createNotificationAndPublish({
      userId: offer.sellerId,
      type: 'counter_offer',
      title: 'Karsi teklif aldiniz',
      description: `"${offer.listing.title}" ilanindaki teklifinize karsi teklif yapildi.`,
      link: `/offers/${offer.id}`,
      entityId: offer.id,
    });
    emitRealtimeEvents([
      eventForUser(offer.sellerId, 'offer.updated', offer.id),
      eventForUser(offer.listing.buyerId, 'offer.updated', offer.id),
    ]);
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: 'Gecersiz islem' }, { status: 400 });
}
