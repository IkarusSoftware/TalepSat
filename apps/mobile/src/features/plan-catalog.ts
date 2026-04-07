import type { Plan } from '../types';
import {
  analyticsTierFeatureTitle,
  analyticsTierShortValue,
} from '../../../../shared/plan-analytics';

export type PlanMeta = {
  description: string;
  accent: string;
  accentSoft: string;
  icon: 'sparkles-outline' | 'flash-outline' | 'diamond-outline' | 'shield-checkmark-outline';
  popular?: boolean;
};

const PLAN_META: Record<string, PlanMeta> = {
  free: {
    description: 'TalepSat’a başlamak ve temel görünürlük kazanmak için ideal giriş planı.',
    accent: '#64748b',
    accentSoft: '#f1f5f9',
    icon: 'sparkles-outline',
  },
  basic: {
    description: 'Temel satış takibi isteyen satıcılar için sade başlangıç paketi.',
    accent: '#2563eb',
    accentSoft: '#dbeafe',
    icon: 'flash-outline',
  },
  plus: {
    description: 'Trendler ve kırılımlarla performansını büyütmek isteyen ekipler için.',
    accent: '#d97706',
    accentSoft: '#fef3c7',
    icon: 'diamond-outline',
    popular: true,
  },
  pro: {
    description: 'Gelişmiş raporlama, karşılaştırma ve export isteyen profesyoneller için.',
    accent: '#0f766e',
    accentSoft: '#ccfbf1',
    icon: 'shield-checkmark-outline',
  },
};

export type EnrichedPlan = Plan & { meta: PlanMeta };

export function enrichPlans(plans: Plan[]): EnrichedPlan[] {
  return [...plans]
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((plan) => ({
      ...plan,
      meta: PLAN_META[plan.slug] ?? PLAN_META.free,
    }));
}

export function planLabel(slug?: string | null) {
  switch (slug) {
    case 'basic':
      return 'Basic';
    case 'plus':
      return 'Plus';
    case 'pro':
      return 'Pro';
    default:
      return 'Free';
  }
}

export function formatPlanPrice(value: number) {
  if (value === 0) return 'Ücretsiz';
  return new Intl.NumberFormat('tr-TR').format(value);
}

export function featureRows(plans: EnrichedPlan[]) {
  return [
    {
      label: 'Aylık teklif hakkı',
      values: plans.map((plan) => (plan.offersPerMonth === null ? 'Sınırsız' : String(plan.offersPerMonth))),
    },
    {
      label: 'Öne çıkarma',
      values: plans.map((plan) => {
        if (plan.boostPerMonth === null) return 'Sınırsız';
        if (plan.boostPerMonth === 0) return '—';
        return `${plan.boostPerMonth}/ay`;
      }),
    },
    {
      label: 'Maks. aktif ilan',
      values: plans.map((plan) => (plan.maxListings === null ? 'Sınırsız' : String(plan.maxListings))),
    },
    {
      label: 'Yanıt süresi',
      values: plans.map((plan) => plan.responseTime || 'Standart'),
    },
    {
      label: 'Analitik seviyesi',
      values: plans.map((plan) => analyticsTierShortValue(plan.analyticsTier)),
    },
    {
      label: 'Öncelikli destek',
      values: plans.map((plan) => plan.prioritySupport),
    },
    {
      label: 'Doğrulanmış rozet',
      values: plans.map((plan) => plan.verifiedBadge),
    },
  ];
}

export function includedFeatures(plan: Plan) {
  return [
    `Aylık ${plan.offersPerMonth === null ? 'sınırsız' : plan.offersPerMonth} teklif hakkı`,
    `${plan.boostPerMonth === null ? 'Sınırsız' : plan.boostPerMonth} öne çıkarma`,
    `${plan.maxListings === null ? 'Sınırsız' : plan.maxListings} aktif ilan limiti`,
    `${plan.responseTime || 'Standart'} destek yanıt süresi`,
    plan.analyticsTier !== 'none' ? analyticsTierFeatureTitle(plan.analyticsTier) : null,
    plan.prioritySupport ? 'Öncelikli destek' : null,
    plan.verifiedBadge ? 'Doğrulanmış rozet' : null,
    plan.customProfile ? 'Özelleştirilmiş profil' : null,
  ].filter(Boolean) as string[];
}

export const planFaqs = [
  {
    question: 'Planımı istediğim zaman değiştirebilir miyim?',
    answer: 'Evet. Uygun planı seçip abonelik ekranından iyzico checkout ile geçiş yapabilir, mevcut aboneliğin için iptal veya devam ettirme işlemlerini yönetebilirsin.',
  },
  {
    question: 'Ödemeyi nasıl tamamlıyorum?',
    answer: 'Plan seçimi sonrası güvenli iyzico sayfası açılır. Ödeme bittikten sonra abonelik ekranına dönüp güncel durumu görebilirsin.',
  },
  {
    question: 'Alıcılar için ücret var mı?',
    answer: 'Hayır. İlan oluşturmak ve teklif almak ücretsizdir; planlar ağırlıklı olarak satıcı deneyimine yöneliktir.',
  },
  {
    question: 'Ödemeyi mobilde yapabilir miyim?',
    answer: 'Evet. Mobil uygulama iyzico checkout bağlantısını güvenli web görünümünde açar ve ödeme tamamlanınca abonelik durumunu yeniden okuyabilir.',
  },
];
