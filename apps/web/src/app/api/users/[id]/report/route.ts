import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/users/[id]/report — report user
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: reportedId } = await params;
  const body = await req.json();

  if (reportedId === session.user.id) {
    return NextResponse.json({ error: 'Kendini şikayet edemezsin' }, { status: 400 });
  }

  const validReasons = ['spam', 'harassment', 'fraud', 'inappropriate', 'other'];
  if (!body.reason || !validReasons.includes(body.reason)) {
    return NextResponse.json({ error: 'Geçersiz şikayet nedeni' }, { status: 400 });
  }

  await prisma.userReport.create({
    data: {
      reporterId: session.user.id,
      reportedId,
      reason: body.reason,
      detail: body.detail || null,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
