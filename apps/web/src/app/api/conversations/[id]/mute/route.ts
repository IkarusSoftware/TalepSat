import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/conversations/[id]/mute — toggle mute
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: session.user.id } },
  });
  if (!participant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const updated = await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId: id, userId: session.user.id } },
    data: { muted: !participant.muted },
  });

  return NextResponse.json({ muted: updated.muted });
}
