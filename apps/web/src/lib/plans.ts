import {
  analyticsTierFeatureTitle,
  hasAnalyticsAccess,
  normalizeAnalyticsTier,
  type AnalyticsTier,
} from '../../../../shared/plan-analytics';

type PlanLike = {
  id: string;
  slug: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  iyzicoMonthlyPlanRef?: string | null;
  iyzicoYearlyPlanRef?: string | null;
  offersPerMonth: number | null;
  boostPerMonth: number | null;
  maxListings: number | null;
  analytics?: boolean | null;
  analyticsTier?: string | null;
  prioritySupport: boolean;
  verifiedBadge: boolean;
  customProfile?: boolean | null;
  responseTime?: string | null;
  sortOrder?: number | null;
  updatedAt?: Date | string;
};

export type SerializedPlan = Omit<PlanLike, 'analyticsTier' | 'analytics'> & {
  analyticsTier: AnalyticsTier;
  analytics: boolean;
};

export function serializePlan(plan: PlanLike): SerializedPlan {
  const analyticsTier = normalizeAnalyticsTier(plan.analyticsTier, plan.slug, plan.analytics);

  return {
    ...plan,
    customProfile: Boolean(plan.customProfile),
    responseTime: plan.responseTime || 'Standart',
    sortOrder: plan.sortOrder ?? 0,
    analyticsTier,
    analytics: hasAnalyticsAccess(analyticsTier),
  };
}

export function analyticsFeatureLine(plan: Pick<SerializedPlan, 'analyticsTier'>) {
  return analyticsTierFeatureTitle(plan.analyticsTier);
}
