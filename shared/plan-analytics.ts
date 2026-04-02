export const analyticsTierValues = ['none', 'basic', 'plus', 'pro'] as const;

export type AnalyticsTier = (typeof analyticsTierValues)[number];

function isAnalyticsTier(value: unknown): value is AnalyticsTier {
  return typeof value === 'string' && analyticsTierValues.includes(value as AnalyticsTier);
}

export function fallbackAnalyticsTierForPlanSlug(
  slug?: string | null,
  analytics?: boolean | null,
): AnalyticsTier {
  switch (slug) {
    case 'basic':
      return 'basic';
    case 'plus':
      return 'plus';
    case 'pro':
      return 'pro';
    case 'free':
      return 'none';
    default:
      return analytics ? 'basic' : 'none';
  }
}

export function normalizeAnalyticsTier(
  value: unknown,
  slug?: string | null,
  analytics?: boolean | null,
): AnalyticsTier {
  if (isAnalyticsTier(value)) {
    if (value === 'none' && analytics && slug && slug !== 'free') {
      return fallbackAnalyticsTierForPlanSlug(slug, analytics);
    }
    return value;
  }
  return fallbackAnalyticsTierForPlanSlug(slug, analytics);
}

export function hasAnalyticsAccess(tier: AnalyticsTier) {
  return tier !== 'none';
}

export function analyticsTierFeatureTitle(tier: AnalyticsTier) {
  switch (tier) {
    case 'basic':
      return 'Temel satış takibi';
    case 'plus':
      return 'Orta seviye analitik ve kırılımlar';
    case 'pro':
      return 'Gelişmiş raporlama ve analitik yönetimi';
    default:
      return 'Analitik yok';
  }
}

export function analyticsTierShortValue(tier: AnalyticsTier) {
  switch (tier) {
    case 'basic':
      return 'Temel';
    case 'plus':
      return 'Orta';
    case 'pro':
      return 'Gelişmiş';
    default:
      return 'Yok';
  }
}
