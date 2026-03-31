import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-session';
import { prisma } from '@/lib/prisma';

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

  // Gather listing IDs to find accepted offers
  const listingIds = conversations.map((c) => c.listingId).filter(Boolean) as string[];
  const acceptedOffers = listingIds.length > 0
    ? await prisma.offer.findMany({
        where: { listingId: { in: listingIds }, status: { in: ['accepted', 'completed'] } },
        select: { id: true, listingId: true, status: true, sellerId: true },
      })
    : [];

  const result = conversations.map((c) => {
    const otherParticipant = c.participants.find((p) => p.userId !== userId);
    const myParticipant = c.participants.find((p) => p.userId === userId);
    const lastMsg = c.messages[0];
    const relatedOffer = c.listingId ? acceptedOffers.find((o) => o.listingId === c.listingId) : null;
    const lastAttachments = lastMsg?.attachments ? JSON.parse(lastMsg.attachments) as { name?: string }[] : [];
    const lastMessagePreview =
      lastMsg?.text ||
      (lastAttachments.length > 0 ? `📎 ${lastAttachments[0].name || 'Dosya'}` : '');

    return {
      id: c.id,
      listingId: c.listingId,
      listingTitle: c.listingTitle,
      participantId: otherParticipant?.user.id,
      participantName: otherParticipant?.user.name ?? 'Kullanıcı',
      participantInitials: (otherParticipant?.user.name ?? 'K').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
      participantVerified: otherParticipant?.user.verified ?? false,
      participantLastSeen: otherParticipant?.user.lastSeen ?? null,
      lastMessage: lastMessagePreview,
      lastMessageAt: lastMsg?.createdAt ?? c.createdAt,
      unreadCount: myParticipant?.unreadCount ?? 0,
      muted: myParticipant?.muted ?? false,
      // Offer info for the chat
      acceptedOfferId: relatedOffer?.id ?? null,
      acceptedOfferStatus: relatedOffer?.status ?? null,
      isBuyerInOffer: relatedOffer ? relatedOffer.sellerId === otherParticipant?.user.id : false,
    };
  });

  return NextResponse.json(result);
}

// POST /api/conversations — start a new conversation
export async function POST(req: NextRequest) {
  const session = await getApiSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.userId;

  const body = await req.json();
  const { participantId, listingId, listingTitle, message } = body;

  if (!participantId || !message) {
    return NextResponse.json({ error: 'Gerekli alanlar eksik' }, { status: 400 });
  }

  // Check if conversation already exists between these users for this listing
  const existing = await prisma.conversation.findFirst({
    where: {
      listingId: listingId || null,
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: participantId } } },
      ],
    },
  });

  if (existing) {
    // Add message to existing conversation
    await prisma.message.create({
      data: { conversationId: existing.id, senderId: userId, text: message },
    });
    await prisma.conversationParticipant.updateMany({
      where: { conversationId: existing.id, userId: participantId },
      data: { unreadCount: { increment: 1 } },
    });
    await prisma.conversation.update({ where: { id: existing.id }, data: { updatedAt: new Date() } });
    return NextResponse.json({ id: existing.id });
  }

  const conversation = await prisma.conversation.create({
    data: {
      listingId,
      listingTitle,
      participants: {
        create: [
          { userId },
          { userId: participantId, unreadCount: 1 },
        ],
      },
      messages: {
        create: { senderId: userId, text: message },
      },
    },
  });

  return NextResponse.json({ id: conversation.id }, { status: 201 });
}
