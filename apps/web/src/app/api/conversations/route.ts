import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-session';
import { normalizeResponseMediaUrl } from '@/lib/media';
import { prisma } from '@/lib/prisma';
import { eventForUser, emitRealtimeEvents } from '@/lib/realtime';
import { sendPushToUser } from '@/lib/push';
import { consumeRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/security';
import { isActiveUserStatus } from '@/lib/user-status';

const MAX_MESSAGE_LENGTH = 4000;

function getMessagePreview(text: string | null | undefined, attachments: { name?: string }[]) {
  const trimmed = text?.trim();
  if (trimmed) return trimmed;
  if (attachments.length > 0) return `Ek: ${attachments[0].name || 'Dosya'}`;
  return '';
}

function parseAttachmentPreview(raw: string | null) {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// GET /api/conversations
export async function GET(req: NextRequest) {
  const session = await getApiSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.userId;

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: { some: { userId } },
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, verified: true, image: true, lastSeen: true } },
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const listingIds = conversations.map((c) => c.listingId).filter(Boolean) as string[];
  const acceptedOffers = listingIds.length > 0
    ? await prisma.offer.findMany({
        where: { listingId: { in: listingIds }, status: { in: ['accepted', 'completed'] } },
        select: { id: true, listingId: true, status: true, sellerId: true },
      })
    : [];

  const result = conversations.map((conversation) => {
    const otherParticipant = conversation.participants.find((p) => p.userId !== userId);
    const myParticipant = conversation.participants.find((p) => p.userId === userId);
    const lastMessage = conversation.messages[0];
    const relatedOffer = conversation.listingId
      ? acceptedOffers.find((offer) => offer.listingId === conversation.listingId)
      : null;
    const lastAttachments = parseAttachmentPreview(lastMessage?.attachments ?? null);

    return {
      id: conversation.id,
      listingId: conversation.listingId,
      listingTitle: conversation.listingTitle,
      participantId: otherParticipant?.user.id,
      participantName: otherParticipant?.user.name ?? 'Kullanici',
      participantInitials: (otherParticipant?.user.name ?? 'K')
        .split(' ')
        .map((name: string) => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
      participantVerified: otherParticipant?.user.verified ?? false,
      participantLastSeen: otherParticipant?.user.lastSeen ?? null,
      participantImage: normalizeResponseMediaUrl(otherParticipant?.user.image ?? null, req),
      lastMessage: getMessagePreview(lastMessage?.text, lastAttachments),
      lastMessageAt: lastMessage?.createdAt ?? conversation.createdAt,
      unreadCount: myParticipant?.unreadCount ?? 0,
      muted: myParticipant?.muted ?? false,
      acceptedOfferId: relatedOffer?.id ?? null,
      acceptedOfferStatus: relatedOffer?.status ?? null,
      isBuyerInOffer: relatedOffer ? relatedOffer.sellerId === otherParticipant?.user.id : false,
    };
  });

  return NextResponse.json(result);
}

// POST /api/conversations - start a new conversation
export async function POST(req: NextRequest) {
  const session = await getApiSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.userId;
  const ip = getClientIp(req);

  const rateLimit = consumeRateLimit({
    key: `conversation-create:${userId}:${ip}`,
    limit: 10,
    windowMs: 60_000,
  });
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit, 'Cok sik yeni sohbet baslatamazsiniz.');
  }

  const body = await req.json().catch(() => null);
  const participantId = typeof body?.participantId === 'string' ? body.participantId.trim() : '';
  const listingId = typeof body?.listingId === 'string' ? body.listingId.trim() : '';
  const message = typeof body?.message === 'string' ? body.message.trim() : '';

  if (!participantId || !message) {
    return NextResponse.json({ error: 'Gerekli alanlar eksik' }, { status: 400 });
  }
  if (participantId === userId) {
    return NextResponse.json({ error: 'Kendinizle sohbet baslatamazsiniz' }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: 'Mesaj cok uzun' }, { status: 400 });
  }

  const participantUser = await prisma.user.findUnique({
    where: { id: participantId },
    select: { id: true, status: true },
  });
  if (!participantUser || !isActiveUserStatus(participantUser.status)) {
    return NextResponse.json({ error: 'Katilimci bulunamadi' }, { status: 404 });
  }

  const block = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedId: participantId },
        { blockerId: participantId, blockedId: userId },
      ],
    },
    select: { id: true },
  });
  if (block) {
    return NextResponse.json({ error: 'Bu kullanici ile mesajlasamazsiniz' }, { status: 403 });
  }

  let resolvedListingId: string | null = null;
  let resolvedListingTitle: string | null = null;

  if (listingId) {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, title: true, buyerId: true },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Ilan bulunamadi' }, { status: 404 });
    }
    if (listing.buyerId !== userId && listing.buyerId !== participantId) {
      return NextResponse.json({ error: 'Bu ilan icin sohbet baslatamazsiniz' }, { status: 403 });
    }

    resolvedListingId = listing.id;
    resolvedListingTitle = listing.title;
  }

  const existing = await prisma.conversation.findFirst({
    where: {
      listingId: resolvedListingId,
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: participantId } } },
      ],
    },
  });

  if (existing) {
    const createdMessage = await prisma.message.create({
      data: { conversationId: existing.id, senderId: userId, text: message },
    });

    await prisma.conversationParticipant.updateMany({
      where: { conversationId: existing.id, userId: participantId },
      data: { unreadCount: { increment: 1 } },
    });
    await prisma.conversation.update({ where: { id: existing.id }, data: { updatedAt: new Date() } });

    emitRealtimeEvents([
      eventForUser(participantId, 'message.created', createdMessage.id, { conversationId: existing.id }),
      eventForUser(participantId, 'conversation.updated', existing.id, { conversationId: existing.id }),
      eventForUser(userId, 'conversation.updated', existing.id, { conversationId: existing.id }),
    ]);

    await sendPushToUser(participantId, {
      title: session.name || 'Yeni mesaj',
      body: message,
      data: {
        conversationId: existing.id,
        link: `/messages?conversation=${existing.id}`,
      },
    });

    return NextResponse.json({ id: existing.id });
  }

  const conversation = await prisma.conversation.create({
    data: {
      listingId: resolvedListingId,
      listingTitle: resolvedListingTitle,
      participants: {
        create: [
          { userId },
          { userId: participantId, unreadCount: 1 },
        ],
      },
    },
  });

  const createdMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: userId,
      text: message,
    },
  });

  emitRealtimeEvents([
    eventForUser(participantId, 'message.created', createdMessage.id, { conversationId: conversation.id }),
    eventForUser(participantId, 'conversation.updated', conversation.id, { conversationId: conversation.id }),
    eventForUser(userId, 'conversation.updated', conversation.id, { conversationId: conversation.id }),
  ]);

  await sendPushToUser(participantId, {
    title: session.name || 'Yeni mesaj',
    body: message,
    data: {
      conversationId: conversation.id,
      link: `/messages?conversation=${conversation.id}`,
    },
  });

  return NextResponse.json({ id: conversation.id }, { status: 201 });
}
