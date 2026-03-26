import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'all';
  const limit = parseInt(searchParams.get('limit') || '50');
  const sort = searchParams.get('sort') || 'recent';

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status === 'verified') {
    where.verified = true;
  } else if (status === 'unverified') {
    where.verified = false;
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      badge: true,
      verified: true,
      score: true,
      completedDeals: true,
      createdAt: true,
      lastSeen: true,
      _count: {
        select: {
          listings: true,
          offers: true,
          reportedBy: true,
        },
      },
    },
    orderBy: sort === 'recent' ? { createdAt: 'desc' } : { name: 'asc' },
    take: limit,
  });

  const formatted = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    role: u.role,
    badge: u.badge || 'basic',
    verified: u.verified,
    score: u.score,
    completedDeals: u.completedDeals,
    createdAt: u.createdAt,
    lastSeen: u.lastSeen,
    listingCount: u._count.listings,
    offerCount: u._count.offers,
    reportCount: u._count.reportedBy,
    status: 'active' as string,
  }));

  return NextResponse.json(formatted);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { userId, action } = await req.json();

  if (!userId || !action) {
    return NextResponse.json({ error: 'userId ve action gerekli' }, { status: 400 });
  }

  switch (action) {
    case 'verify':
      await prisma.user.update({ where: { id: userId }, data: { verified: true } });
      break;
    case 'unverify':
      await prisma.user.update({ where: { id: userId }, data: { verified: false } });
      break;
    default:
      return NextResponse.json({ error: 'Geçersiz aksiyon' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
