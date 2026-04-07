import type { AnalyticsTier } from './plan-analytics';

export type SellerAnalyticsRange = '7d' | '30d' | '90d' | 'custom';

export type SellerAnalyticsFilters = {
  from?: string | null;
  to?: string | null;
  listingId?: string | null;
  category?: string | null;
  city?: string | null;
};

export type SellerAnalyticsRecentOffer = {
  id: string;
  price: number;
  deliveryDays: number;
  status: string;
  listingId: string;
  listingTitle: string;
  listingCategory: string;
  listingCity: string;
  updatedAt: string;
  createdAt: string;
};

export type SellerAnalyticsTrendPoint = {
  key: string;
  label: string;
  offers: number;
  revenue: number;
};

export type SellerAnalyticsStatusBreakdown = {
  key: string;
  label: string;
  count: number;
};

export type SellerAnalyticsCategoryBreakdown = {
  key: string;
  label: string;
  count: number;
  revenue: number;
};

export type SellerAnalyticsListingBreakdown = {
  listingId: string;
  title: string;
  category: string;
  city: string;
  count: number;
  accepted: number;
  revenue: number;
  views: number;
};

export type SellerAnalyticsCityBreakdown = {
  key: string;
  label: string;
  count: number;
  revenue: number;
};

export type SellerAnalyticsComparison = {
  previousPeriod: {
    totalOffers: number;
    acceptedOffers: number;
    totalRevenue: number;
    acceptanceRate: number;
    totalViews: number;
  };
  delta: {
    totalOffers: number;
    acceptedOffers: number;
    totalRevenue: number;
    acceptanceRate: number;
    totalViews: number;
  };
};

export type SellerAnalyticsSnapshot = {
  tier: AnalyticsTier;
  planSlug: string | null;
  range: SellerAnalyticsRange;
  filters: SellerAnalyticsFilters;
  upgradeRequired?: boolean;
  summary: {
    totalOffers: number;
    acceptedOffers: number;
    pendingOffers: number;
    rejectedOffers: number;
    counterOffers: number;
    acceptanceRate: number;
    totalRevenue: number;
    averageScore: number;
    reviewCount: number;
    activeListings: number;
    totalViews: number;
  };
  recentOffers: SellerAnalyticsRecentOffer[];
  trends?: {
    offers: SellerAnalyticsTrendPoint[];
    revenue: SellerAnalyticsTrendPoint[];
  };
  breakdowns?: {
    byStatus: SellerAnalyticsStatusBreakdown[];
    byCategory: SellerAnalyticsCategoryBreakdown[];
    topListings: SellerAnalyticsListingBreakdown[];
    byCity?: SellerAnalyticsCityBreakdown[];
  };
  comparison?: SellerAnalyticsComparison;
};
