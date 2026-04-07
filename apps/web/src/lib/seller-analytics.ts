import type {
  SellerAnalyticsComparison,
  SellerAnalyticsFilters,
  SellerAnalyticsRange,
  SellerAnalyticsSnapshot,
  SellerAnalyticsTrendPoint,
} from '../../../../shared/seller-analytics';
import { normalizeAnalyticsTier, type AnalyticsTier } from '../../../../shared/plan-analytics';
import { getSubscriptionSnapshot } from './billing';
import { prisma } from './prisma';

const ACCEPTED_STATUSES = new Set(['accepted', 'completed']);
const REJECTED_STATUSES = new Set(['rejected', 'withdrawn']);
const rangeDays: Record<Exclude<SellerAnalyticsRange, 'custom'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

type AnalyticsWindow = {
  range: SellerAnalyticsRange;
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
};

type OfferRow = {
  id: string;
  price: number;
  deliveryDays: number;
  status: string;
  listingId: string;
  createdAt: Date;
  updatedAt: Date;
  listing: {
    id: string;
    title: string;
    category: string;
    categorySlug: string;
    city: string;
  };
};

type ReviewRow = {
  rating: number;
};

type AnalyticsDataset = {
  offers: OfferRow[];
  reviews: ReviewRow[];
  viewCountByListingId: Map<string, number>;
};

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function dayCountInclusive(start: Date, end: Date) {
  const ms = endOfDay(end).getTime() - startOfDay(start).getTime();
  return Math.max(1, Math.round(ms / 86400000) + 1);
}

function sanitizeRange(input: string | null, tier: AnalyticsTier): SellerAnalyticsRange {
  if (tier === 'none' || tier === 'basic') return '30d';
  if (tier === 'plus') {
    return input === '7d' || input === '90d' ? input : '30d';
  }
  return input === '7d' || input === '90d' || input === 'custom' ? input : '30d';
}

function resolveWindow(
  rangeInput: string | null,
  rawFilters: SellerAnalyticsFilters,
  tier: AnalyticsTier,
): AnalyticsWindow {
  const now = new Date();
  const range = sanitizeRange(rangeInput, tier);

  if (range === 'custom' && tier === 'pro' && rawFilters.from && rawFilters.to) {
    const from = startOfDay(new Date(rawFilters.from));
    const to = endOfDay(new Date(rawFilters.to));
    if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && from <= to) {
      const spanDays = dayCountInclusive(from, to);
      return {
        range,
        start: from,
        end: to,
        previousStart: addDays(from, -spanDays),
        previousEnd: endOfDay(addDays(from, -1)),
      };
    }
  }

  const days = rangeDays[range === 'custom' ? '30d' : range];
  const start = startOfDay(addDays(now, -(days - 1)));
  const end = endOfDay(now);
  return {
    range: range === 'custom' ? '30d' : range,
    start,
    end,
    previousStart: startOfDay(addDays(start, -days)),
    previousEnd: endOfDay(addDays(start, -1)),
  };
}

function sanitizeFilters(rawFilters: SellerAnalyticsFilters, tier: AnalyticsTier): SellerAnalyticsFilters {
  if (tier !== 'pro') {
    return {};
  }

  return {
    from: rawFilters.from || null,
    to: rawFilters.to || null,
    listingId: rawFilters.listingId || null,
    category: rawFilters.category || null,
    city: rawFilters.city || null,
  };
}

function percentageDelta(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function statusLabel(status: string) {
  switch (status) {
    case 'accepted':
      return 'Kabul edildi';
    case 'completed':
      return 'Tamamlandı';
    case 'pending':
      return 'Bekliyor';
    case 'rejected':
      return 'Reddedildi';
    case 'counter_offered':
      return 'Karşı teklif';
    case 'withdrawn':
      return 'Geri çekildi';
    default:
      return status;
  }
}

function zeroSnapshot(tier: AnalyticsTier, planSlug: string | null, range: SellerAnalyticsRange, filters: SellerAnalyticsFilters): SellerAnalyticsSnapshot {
  return {
    tier,
    planSlug,
    range,
    filters,
    upgradeRequired: tier === 'none',
    summary: {
      totalOffers: 0,
      acceptedOffers: 0,
      pendingOffers: 0,
      rejectedOffers: 0,
      counterOffers: 0,
      acceptanceRate: 0,
      totalRevenue: 0,
      averageScore: 0,
      reviewCount: 0,
      activeListings: 0,
      totalViews: 0,
    },
    recentOffers: [],
  };
}

async function resolveSellerEntitlement(userId: string) {
  const snapshot = await getSubscriptionSnapshot(userId);
  const plan =
    snapshot.entitledSubscription?.plan ||
    (await prisma.plan.findUnique({ where: { slug: snapshot.badge || 'free' } })) ||
    (await prisma.plan.findUnique({ where: { slug: 'free' } }));

  const tier = normalizeAnalyticsTier(plan?.analyticsTier, plan?.slug, plan?.analytics);
  return {
    plan,
    planSlug: plan?.slug || snapshot.badge || 'free',
    tier,
  };
}

async function loadDataset(
  userId: string,
  window: { start: Date; end: Date },
  filters: SellerAnalyticsFilters,
): Promise<AnalyticsDataset> {
  const listingWhere: Record<string, unknown> = {};
  if (filters.category) listingWhere.categorySlug = filters.category;
  if (filters.city) listingWhere.city = { contains: filters.city };

  const offers = await prisma.offer.findMany({
    where: {
      sellerId: userId,
      createdAt: {
        gte: window.start,
        lte: window.end,
      },
      ...(filters.listingId ? { listingId: filters.listingId } : {}),
      ...(Object.keys(listingWhere).length ? { listing: listingWhere } : {}),
    },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          category: true,
          categorySlug: true,
          city: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const listingIds = Array.from(new Set(offers.map((offer) => offer.listingId)));
  const reviews = await prisma.review.findMany({
    where: {
      revieweeId: userId,
      createdAt: {
        gte: window.start,
        lte: window.end,
      },
    },
    select: {
      rating: true,
    },
  });

  const listingViewGroups = listingIds.length
    ? await prisma.listingView.groupBy({
        by: ['listingId'],
        where: {
          listingId: { in: listingIds },
          createdAt: {
            gte: window.start,
            lte: window.end,
          },
        },
        _count: {
          _all: true,
        },
      })
    : [];

  return {
    offers,
    reviews,
    viewCountByListingId: new Map(
      listingViewGroups.map((group) => [group.listingId, group._count._all]),
    ),
  };
}

function buildSummary(dataset: AnalyticsDataset) {
  const totalOffers = dataset.offers.length;
  const acceptedOffers = dataset.offers.filter((offer) => ACCEPTED_STATUSES.has(offer.status)).length;
  const pendingOffers = dataset.offers.filter((offer) => offer.status === 'pending').length;
  const rejectedOffers = dataset.offers.filter((offer) => REJECTED_STATUSES.has(offer.status)).length;
  const counterOffers = dataset.offers.filter((offer) => offer.status === 'counter_offered').length;
  const totalRevenue = dataset.offers
    .filter((offer) => ACCEPTED_STATUSES.has(offer.status))
    .reduce((sum, offer) => sum + offer.price, 0);
  const totalRating = dataset.reviews.reduce((sum, review) => sum + review.rating, 0);
  const reviewCount = dataset.reviews.length;
  const activeListings = new Set(dataset.offers.map((offer) => offer.listingId)).size;
  const totalViews = Array.from(dataset.viewCountByListingId.values()).reduce((sum, value) => sum + value, 0);

  return {
    totalOffers,
    acceptedOffers,
    pendingOffers,
    rejectedOffers,
    counterOffers,
    acceptanceRate: totalOffers ? Math.round((acceptedOffers / totalOffers) * 100) : 0,
    totalRevenue,
    averageScore: reviewCount ? Number((totalRating / reviewCount).toFixed(1)) : 0,
    reviewCount,
    activeListings,
    totalViews,
  };
}

function buildRecentOffers(dataset: AnalyticsDataset) {
  return [...dataset.offers]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 5)
    .map((offer) => ({
      id: offer.id,
      price: offer.price,
      deliveryDays: offer.deliveryDays,
      status: offer.status,
      listingId: offer.listingId,
      listingTitle: offer.listing.title,
      listingCategory: offer.listing.category,
      listingCity: offer.listing.city,
      updatedAt: offer.updatedAt.toISOString(),
      createdAt: offer.createdAt.toISOString(),
    }));
}

function buildTrendPoints(dataset: AnalyticsDataset, window: AnalyticsWindow): SellerAnalyticsTrendPoint[] {
  const formatter = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' });
  const buckets = new Map<string, SellerAnalyticsTrendPoint>();

  for (let cursor = startOfDay(window.start); cursor <= window.end; cursor = addDays(cursor, 1)) {
    const key = cursor.toISOString().slice(0, 10);
    buckets.set(key, {
      key,
      label: formatter.format(cursor),
      offers: 0,
      revenue: 0,
    });
  }

  for (const offer of dataset.offers) {
    const key = offer.createdAt.toISOString().slice(0, 10);
    const point = buckets.get(key);
    if (!point) continue;
    point.offers += 1;
    if (ACCEPTED_STATUSES.has(offer.status)) {
      point.revenue += offer.price;
    }
  }

  return Array.from(buckets.values());
}

function buildBreakdowns(dataset: AnalyticsDataset, includeCity: boolean) {
  const byStatusMap = new Map<string, number>();
  const byCategoryMap = new Map<string, { label: string; count: number; revenue: number }>();
  const byCityMap = new Map<string, { label: string; count: number; revenue: number }>();
  const byListingMap = new Map<string, { title: string; category: string; city: string; count: number; accepted: number; revenue: number; views: number }>();

  for (const offer of dataset.offers) {
    byStatusMap.set(offer.status, (byStatusMap.get(offer.status) || 0) + 1);

    const categoryEntry = byCategoryMap.get(offer.listing.categorySlug) || {
      label: offer.listing.category,
      count: 0,
      revenue: 0,
    };
    categoryEntry.count += 1;
    if (ACCEPTED_STATUSES.has(offer.status)) {
      categoryEntry.revenue += offer.price;
    }
    byCategoryMap.set(offer.listing.categorySlug, categoryEntry);

    if (includeCity) {
      const cityEntry = byCityMap.get(offer.listing.city) || {
        label: offer.listing.city,
        count: 0,
        revenue: 0,
      };
      cityEntry.count += 1;
      if (ACCEPTED_STATUSES.has(offer.status)) {
        cityEntry.revenue += offer.price;
      }
      byCityMap.set(offer.listing.city, cityEntry);
    }

    const listingEntry = byListingMap.get(offer.listingId) || {
      title: offer.listing.title,
      category: offer.listing.category,
      city: offer.listing.city,
      count: 0,
      accepted: 0,
      revenue: 0,
      views: dataset.viewCountByListingId.get(offer.listingId) || 0,
    };
    listingEntry.count += 1;
    if (ACCEPTED_STATUSES.has(offer.status)) {
      listingEntry.accepted += 1;
      listingEntry.revenue += offer.price;
    }
    byListingMap.set(offer.listingId, listingEntry);
  }

  return {
    byStatus: Array.from(byStatusMap.entries())
      .map(([key, count]) => ({ key, label: statusLabel(key), count }))
      .sort((a, b) => b.count - a.count),
    byCategory: Array.from(byCategoryMap.entries())
      .map(([key, value]) => ({ key, label: value.label, count: value.count, revenue: value.revenue }))
      .sort((a, b) => b.count - a.count),
    topListings: Array.from(byListingMap.entries())
      .map(([listingId, value]) => ({
        listingId,
        title: value.title,
        category: value.category,
        city: value.city,
        count: value.count,
        accepted: value.accepted,
        revenue: value.revenue,
        views: value.views,
      }))
      .sort((a, b) => b.revenue - a.revenue || b.count - a.count)
      .slice(0, 8),
    byCity: includeCity
      ? Array.from(byCityMap.entries())
          .map(([key, value]) => ({ key, label: value.label, count: value.count, revenue: value.revenue }))
          .sort((a, b) => b.count - a.count)
      : undefined,
  };
}

function buildComparison(currentSummary: SellerAnalyticsSnapshot['summary'], previousSummary: SellerAnalyticsSnapshot['summary']): SellerAnalyticsComparison {
  return {
    previousPeriod: {
      totalOffers: previousSummary.totalOffers,
      acceptedOffers: previousSummary.acceptedOffers,
      totalRevenue: previousSummary.totalRevenue,
      acceptanceRate: previousSummary.acceptanceRate,
      totalViews: previousSummary.totalViews,
    },
    delta: {
      totalOffers: percentageDelta(currentSummary.totalOffers, previousSummary.totalOffers),
      acceptedOffers: percentageDelta(currentSummary.acceptedOffers, previousSummary.acceptedOffers),
      totalRevenue: percentageDelta(currentSummary.totalRevenue, previousSummary.totalRevenue),
      acceptanceRate: Number((currentSummary.acceptanceRate - previousSummary.acceptanceRate).toFixed(1)),
      totalViews: percentageDelta(currentSummary.totalViews, previousSummary.totalViews),
    },
  };
}

export async function buildSellerAnalyticsSnapshot(userId: string, rawFilters: SellerAnalyticsFilters & { range?: string | null }): Promise<SellerAnalyticsSnapshot> {
  const entitlement = await resolveSellerEntitlement(userId);
  const filters = sanitizeFilters(rawFilters, entitlement.tier);
  const window = resolveWindow(rawFilters.range || null, rawFilters, entitlement.tier);

  if (entitlement.tier === 'none') {
    return zeroSnapshot(entitlement.tier, entitlement.planSlug, window.range, filters);
  }

  const currentDataset = await loadDataset(userId, window, filters);
  const summary = buildSummary(currentDataset);
  const snapshot: SellerAnalyticsSnapshot = {
    tier: entitlement.tier,
    planSlug: entitlement.planSlug,
    range: window.range,
    filters,
    summary,
    recentOffers: buildRecentOffers(currentDataset),
  };

  if (entitlement.tier === 'plus' || entitlement.tier === 'pro') {
    const points = buildTrendPoints(currentDataset, window);
    snapshot.trends = {
      offers: points.map((point) => ({ ...point })),
      revenue: points.map((point) => ({ ...point })),
    };
    snapshot.breakdowns = buildBreakdowns(currentDataset, entitlement.tier === 'pro');
  }

  if (entitlement.tier === 'pro') {
    const previousDataset = await loadDataset(
      userId,
      {
        start: window.previousStart,
        end: window.previousEnd,
      },
      filters,
    );
    snapshot.comparison = buildComparison(summary, buildSummary(previousDataset));
  }

  return snapshot;
}

function csvEscape(value: string | number) {
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildSellerAnalyticsCsv(snapshot: SellerAnalyticsSnapshot) {
  const lines = [
    ['metric', 'value'],
    ['tier', snapshot.tier],
    ['range', snapshot.range],
    ['totalOffers', snapshot.summary.totalOffers],
    ['acceptedOffers', snapshot.summary.acceptedOffers],
    ['pendingOffers', snapshot.summary.pendingOffers],
    ['rejectedOffers', snapshot.summary.rejectedOffers],
    ['counterOffers', snapshot.summary.counterOffers],
    ['acceptanceRate', snapshot.summary.acceptanceRate],
    ['totalRevenue', snapshot.summary.totalRevenue],
    ['averageScore', snapshot.summary.averageScore],
    ['reviewCount', snapshot.summary.reviewCount],
    ['activeListings', snapshot.summary.activeListings],
    ['totalViews', snapshot.summary.totalViews],
    [],
    ['listingTitle', 'city', 'category', 'offers', 'accepted', 'revenue', 'views'],
  ];

  for (const listing of snapshot.breakdowns?.topListings || []) {
    lines.push([
      listing.title,
      listing.city,
      listing.category,
      listing.count,
      listing.accepted,
      listing.revenue,
      listing.views,
    ]);
  }

  if (snapshot.breakdowns?.byCategory?.length) {
    lines.push([]);
    lines.push(['category', 'offers', 'revenue']);
    for (const category of snapshot.breakdowns.byCategory) {
      lines.push([category.label, category.count, category.revenue]);
    }
  }

  if (snapshot.breakdowns?.byCity?.length) {
    lines.push([]);
    lines.push(['city', 'offers', 'revenue']);
    for (const city of snapshot.breakdowns.byCity) {
      lines.push([city.label, city.count, city.revenue]);
    }
  }

  return lines
    .map((row) => row.map((cell) => csvEscape(cell ?? '')).join(','))
    .join('\n');
}
