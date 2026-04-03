import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user?.id || role !== 'admin') {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const tab    = searchParams.get('status') || 'all';
  const limit  = parseInt(searchParams.get('limit') || '100');
  const sort   = searchParams.get('sort') || 'recent';

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ];
  }

  if (tab === 'verified')   where.verified = true;
  if (tab === 'unverified') where.verified = false;
  if (tab === 'banned')     where.status = 'banned';
  if (tab === 'suspended')  where.status = 'suspended';
  if (tab === 'deactivated') where.status = 'deactivated';

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true, name: true, email: true, image: true,
      role: true, badge: true, verified: true, status: true,
      score: true, completedDeals: true, createdAt: true, lastSeen: true,
      _count: { select: { listings: true, offers: true, reportedBy: true } },
    },
    orderBy: sort === 'recent' ? { createdAt: 'desc' } : { name: 'asc' },
    take: limit,
  });

  return NextResponse.json(users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    role: u.role,
    badge: u.badge || 'free',
    verified: u.verified,
    status: u.status || 'active',
    score: u.score,
    completedDeals: u.completedDeals,
    createdAt: u.createdAt,
    lastSeen: u.lastSeen,
    listingCount: u._count.listings,
    offerCount: u._count.offers,
    reportCount: u._count.reportedBy,
  })));
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user?.id || role !== 'admin') {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const body = await req.json();
  const { userId, action, badge } = body;

  if (!userId || !action) {
    return NextResponse.json({ error: 'userId ve action gerekli' }, { status: 400 });
  }

  // Prevent acting on self
  if (userId === session.user.id) {
    return NextResponse.json({ error: 'Kendi hesabınıza işlem yapamazsınız' }, { status: 400 });
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
        return NextResponse.json({ error: 'Geçersiz plan' }, { status: 400 });
      }
      await prisma.user.update({
        where: { id: userId },
        data: { badge: badge === 'free' ? null : badge },
      });
      break;
    }
    default:
      return NextResponse.json({ error: 'Geçersiz aksiyon' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
