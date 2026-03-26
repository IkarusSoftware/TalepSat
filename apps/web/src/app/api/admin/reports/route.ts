import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'all';
  const search = searchParams.get('search') || '';

  const where: Record<string, unknown> = {};

  if (status !== 'all') {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { detail: { contains: search, mode: 'insensitive' } },
      { reporter: { name: { contains: search, mode: 'insensitive' } } },
      { reported: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const reports = await prisma.userReport.findMany({
    where,
    include: {
      reporter: { select: { id: true, name: true, email: true, image: true } },
      reported: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json(reports);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { reportId, action } = await req.json();

  if (!reportId || !action) {
    return NextResponse.json({ error: 'reportId ve action gerekli' }, { status: 400 });
  }

  let newStatus: string;
  switch (action) {
    case 'resolve':
      newStatus = 'resolved';
      break;
    case 'review':
      newStatus = 'reviewed';
      break;
    case 'dismiss':
      newStatus = 'resolved';
      break;
    default:
      return NextResponse.json({ error: 'Geçersiz aksiyon' }, { status: 400 });
  }

  const updated = await prisma.userReport.update({
    where: { id: reportId },
    data: { status: newStatus },
  });

  return NextResponse.json(updated);
}
