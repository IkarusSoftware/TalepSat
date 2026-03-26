import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE /api/conversations/[id] — delete conversation for user
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Verify user is participant
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: session.user.id } },
  });
  if (!participant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Remove participant from conversation
  await prisma.conversationParticipant.delete({
    where: { conversationId_userId: { conversationId: id, userId: session.user.id } },
  });

  // If no participants left, delete the conversation entirely
  const remaining = await prisma.conversationParticipant.count({
    where: { conversationId: id },
  });
  if (remaining === 0) {
    await prisma.conversation.delete({ where: { id } });
  }

  return NextResponse.json({ ok: true });
}
