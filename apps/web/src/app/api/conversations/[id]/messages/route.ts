import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/conversations/[id]/messages
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Verify user is participant
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: session.user.id } },
  });
  if (!participant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  });

  // Mark as read
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId: id, userId: session.user.id } },
    data: { unreadCount: 0 },
  });

  return NextResponse.json(messages);
}

// POST /api/conversations/[id]/messages — send message
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // Verify user is participant
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: session.user.id } },
  });
  if (!participant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const message = await prisma.message.create({
    data: { conversationId: id, senderId: session.user.id, text: body.text },
    include: { sender: { select: { id: true, name: true } } },
  });

  // Increment unread for other participants
  await prisma.conversationParticipant.updateMany({
    where: { conversationId: id, userId: { not: session.user.id } },
    data: { unreadCount: { increment: 1 } },
  });

  await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });

  return NextResponse.json(message, { status: 201 });
}
