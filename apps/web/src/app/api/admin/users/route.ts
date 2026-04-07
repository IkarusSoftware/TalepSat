import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/admin-session';

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const tab = searchParams.get('status') || 'all';
  const requestedLimit = parseInt(searchParams.get('limit') || '100', 10);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 200) : 100;
  const sort = searchParams.get('sort') || 'recent';

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ];
  }

  if (tab === 'verified') where.verified = true;
  if (tab === 'unverified') where.verified = false;
  if (tab === 'banned') where.status = 'banned';
  if (tab === 'suspended') where.status = 'suspended';
  if (tab === 'deactivated') where.status = 'deactivated';

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
      status: true,
      score: true,
      completedDeals: true,
      createdAt: true,
      lastSeen: true,
      _count: { select: { listings: true, offers: true, reportedBy: true } },
    },
    orderBy: sort === 'recent' ? { createdAt: 'desc' } : { name: 'asc' },
    take: limit,
  });

  return NextResponse.json(
    users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      badge: user.badge || 'free',
      verified: user.verified,
      status: user.status || 'active',
      score: user.score,
      completedDeals: user.completedDeals,
      createdAt: user.createdAt,
      lastSeen: user.lastSeen,
      listingCount: user._count.listings,
      offerCount: user._count.offers,
      reportCount: user._count.reportedBy,
    })),
  );
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const body = await req.json();
  const { userId, action, badge } = body;

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
    case 'ban':
      await prisma.user.update({ where: { id: userId }, data: { status: 'banned' } });
      break;
    case 'unban':
      await prisma.user.update({ where: { id: userId }, data: { status: 'active' } });
      break;
    case 'suspend':
      await prisma.user.update({ where: { id: userId }, data: { status: 'suspended' } });
      break;
    case 'unsuspend':
      await prisma.user.update({ where: { id: userId }, data: { status: 'active' } });
      break;
    case 'reactivate':
      await prisma.user.update({ where: { id: userId }, data: { status: 'active' } });
      break;
    case 'setBadge': {
      const allowed = ['free', 'basic', 'plus', 'pro'];
      if (!allowed.includes(badge)) {
        return NextResponse.json({ error: 'Gecersiz plan' }, { status: 400 });
      }
      await prisma.user.update({
        where: { id: userId },
        data: { badge: badge === 'free' ? null : badge },
      });
      break;
    }
    default:
      return NextResponse.json({ error: 'Gecersiz aksiyon' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
