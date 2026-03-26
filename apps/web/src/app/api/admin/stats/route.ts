import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const [totalUsers, totalListings, totalOffers, activeListings, pendingReports, completedDeals] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count(),
    prisma.offer.count(),
    prisma.listing.count({ where: { status: 'active' } }),
    prisma.userReport.count({ where: { status: 'pending' } }),
    prisma.offer.count({ where: { status: 'completed' } }),
  ]);

  // Users registered in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newUsersMonth = await prisma.user.count({
    where: { createdAt: { gte: thirtyDaysAgo } },
  });

  // Users active in last 24 hours
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  const activeUsers24h = await prisma.user.count({
    where: { lastSeen: { gte: oneDayAgo } },
  });

  // Weekly activity (last 7 days offer counts)
  const weeklyActivity: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date();
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    const count = await prisma.offer.count({
      where: { createdAt: { gte: dayStart, lte: dayEnd } },
    });
    weeklyActivity.push(count);
  }

  return NextResponse.json({
    totalUsers,
    totalListings,
    totalOffers,
    totalRevenue: completedDeals * 500, // Approximate
    activeListings,
    pendingReports,
    newUsersMonth,
    activeUsers24h,
    completedDeals,
    weeklyActivity,
  });
}
