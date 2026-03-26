import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/conversations
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: { some: { userId: session.user.id } },
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, verified: true, image: true } },
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const result = conversations.map((c) => {
    const otherParticipant = c.participants.find((p) => p.userId !== session.user!.id);
    const myParticipant = c.participants.find((p) => p.userId === session.user!.id);
    const lastMsg = c.messages[0];

    return {
      id: c.id,
      listingId: c.listingId,
      listingTitle: c.listingTitle,
      participantId: otherParticipant?.user.id,
      participantName: otherParticipant?.user.name ?? 'Kullanıcı',
      participantInitials: (otherParticipant?.user.name ?? 'K').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
      participantVerified: otherParticipant?.user.verified ?? false,
      lastMessage: lastMsg?.text ?? '',
      lastMessageAt: lastMsg?.createdAt ?? c.createdAt,
      unreadCount: myParticipant?.unreadCount ?? 0,
    };
  });

  return NextResponse.json(result);
}

// POST /api/conversations — start a new conversation
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
        { participants: { some: { userId: session.user.id } } },
        { participants: { some: { userId: participantId } } },
      ],
    },
  });

  if (existing) {
    // Add message to existing conversation
    await prisma.message.create({
      data: { conversationId: existing.id, senderId: session.user.id, text: message },
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
          { userId: session.user.id },
          { userId: participantId, unreadCount: 1 },
        ],
      },
      messages: {
        create: { senderId: session.user.id, text: message },
      },
    },
  });

  return NextResponse.json({ id: conversation.id }, { status: 201 });
}
