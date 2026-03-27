import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Helper: build an array of N days ago -> today
function daysRange(n: number) {
  const days: { start: Date; end: Date; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const start = new Date();
    start.setDate(start.getDate() - i);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    const label = start.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
    days.push({ start, end, label });
  }
  return days;
}

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user?.id || role !== 'admin') {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const oneDayAgo = new Date(now);
  oneDayAgo.setDate(now.getDate() - 1);

  // ── Core totals ──────────────────────────────────────────────────────────
  const [
    totalUsers,
    totalListings,
    totalOffers,
    activeListings,
    pendingReports,
    pendingListings,
    completedDeals,
    newUsersMonth,
    activeUsers24h,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count(),
    prisma.offer.count(),
    prisma.listing.count({ where: { status: 'active' } }),
    prisma.userReport.count({ where: { status: 'pending' } }),
    prisma.listing.count({ where: { status: 'pending' } }),
    prisma.offer.count({ where: { status: 'completed' } }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({ where: { lastSeen: { gte: oneDayAgo } } }),
  ]);

  // ── Weekly activity (last 7 days — offer counts) ──────────────────────────
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

  // ── 30-day daily charts ───────────────────────────────────────────────────
  const days30 = daysRange(30);

  const [userGrowth, listingGrowth, salesGrowth, boostRevenue] = await Promise.all([
    // New users per day
    Promise.all(
      days30.map(async ({ start, end, label }) => ({
        date: label,
        value: await prisma.user.count({ where: { createdAt: { gte: start, lte: end } } }),
      }))
    ),
    // New listings per day
    Promise.all(
      days30.map(async ({ start, end, label }) => ({
        date: label,
        value: await prisma.listing.count({ where: { createdAt: { gte: start, lte: end } } }),
      }))
    ),
    // Completed offers per day
    Promise.all(
      days30.map(async ({ start, end, label }) => ({
        date: label,
        value: await prisma.offer.count({ where: { completedAt: { gte: start, lte: end } } }),
      }))
    ),
    // Boost revenue (isBoosted offers × 99₺ each)
    Promise.all(
      days30.map(async ({ start, end, label }) => ({
        date: label,
        value: (await prisma.offer.count({ where: { isBoosted: true, createdAt: { gte: start, lte: end } } })) * 99,
      }))
    ),
  ]);

  // ── Offer status distribution ─────────────────────────────────────────────
  const offerStatuses = ['pending', 'accepted', 'rejected', 'counter_offered', 'withdrawn', 'completed'];
  const offerStatusData = await Promise.all(
    offerStatuses.map(async (status) => ({
      name: {
        pending: 'Bekleyen',
        accepted: 'Kabul',
        rejected: 'Red',
        counter_offered: 'Karşı Teklif',
        withdrawn: 'Geri Çekilen',
        completed: 'Tamamlanan',
      }[status] ?? status,
      value: await prisma.offer.count({ where: { status } }),
    }))
  );

  // ── Top 8 categories ──────────────────────────────────────────────────────
  const allListings = await prisma.listing.findMany({ select: { category: true } });
  const categoryMap: Record<string, number> = {};
  for (const l of allListings) {
    categoryMap[l.category] = (categoryMap[l.category] ?? 0) + 1;
  }
  const topCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  // ── Top 6 cities ──────────────────────────────────────────────────────────
  const allCityListings = await prisma.listing.findMany({ select: { city: true } });
  const cityMap: Record<string, number> = {};
  for (const l of allCityListings) {
    cityMap[l.city] = (cityMap[l.city] ?? 0) + 1;
  }
  const topCities = Object.entries(cityMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));

  // ── User role distribution ────────────────────────────────────────────────
  const [buyerCount, sellerCount, bothCount] = await Promise.all([
    prisma.user.count({ where: { role: 'buyer' } }),
    prisma.user.count({ where: { role: 'seller' } }),
    prisma.user.count({ where: { role: 'both' } }),
  ]);
  const userRoleData = [
    { name: 'Alıcı', value: buyerCount },
    { name: 'Satıcı', value: sellerCount },
    { name: 'Her İkisi', value: bothCount },
  ];

  // ── Cumulative totals for summary ─────────────────────────────────────────
  const totalBoostRevenue = (await prisma.offer.count({ where: { isBoosted: true } })) * 99;
  const totalRevenue = completedDeals * 500 + totalBoostRevenue;

  return NextResponse.json({
    // Core
    totalUsers,
    totalListings,
    totalOffers,
    totalRevenue,
    activeListings,
    pendingReports,
    pendingListings,
    newUsersMonth,
    activeUsers24h,
    completedDeals,
    weeklyActivity,
    totalBoostRevenue,
    // Charts
    userGrowth,
    listingGrowth,
    salesGrowth,
    boostRevenue,
    offerStatusData,
    topCategories,
    topCities,
    userRoleData,
  });
}
