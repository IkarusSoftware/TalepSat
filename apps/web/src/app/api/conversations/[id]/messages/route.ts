import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-session';
import { prisma } from '@/lib/prisma';

// GET /api/conversations/[id]/messages
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.userId;

  const { id } = await params;

  // Verify user is participant
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId } },
  });
  if (!participant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  });

  // Mark as read
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId: id, userId } },
    data: { unreadCount: 0 },
  });

  const result = messages.map((m) => ({
    ...m,
    attachments: m.attachments ? JSON.parse(m.attachments) : null,
  }));

  return NextResponse.json(result);
}

// POST /api/conversations/[id]/messages — send message
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.userId;

  const { id } = await params;
  const body = await req.json();

  // Verify user is participant
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId } },
  });
  if (!participant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const message = await prisma.message.create({
    data: {
      conversationId: id,
      senderId: userId,
      text: body.text || '',
      attachments: body.attachments ? JSON.stringify(body.attachments) : null,
    },
    include: { sender: { select: { id: true, name: true } } },
  });

  // Increment unread for other participants
  await prisma.conversationParticipant.updateMany({
    where: { conversationId: id, userId: { not: userId } },
    data: { unreadCount: { increment: 1 } },
  });

  await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });

  return NextResponse.json({
    ...message,
    attachments: message.attachments ? JSON.parse(message.attachments) : null,
  }, { status: 201 });
}
