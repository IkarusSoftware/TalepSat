'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Check,
  X,
  Zap,
  Crown,
  Star,
  ArrowRight,
  Shield,
  BarChart3,
  Clock,
  MessageSquare,
  BadgeCheck,
  Loader2,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { analyticsTierFeatureTitle, analyticsTierShortValue } from '../../../../../../shared/plan-analytics';

type BillingCycle = 'monthly' | 'yearly';

type Plan = {
  id: string;
  slug: 'free' | 'basic' | 'plus' | 'pro' | string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  iyzicoMonthlyPlanRef?: string | null;
  iyzicoYearlyPlanRef?: string | null;
  offersPerMonth: number | null;
  boostPerMonth: number | null;
  maxListings: number | null;
  analytics: boolean;
  analyticsTier: 'none' | 'basic' | 'plus' | 'pro';
  prioritySupport: boolean;
  verifiedBadge: boolean;
  customProfile?: boolean;
  responseTime?: string;
  sortOrder?: number;
};

type BillingSnapshot = {
  currentPlan: Plan | null;
  iyzicoConfigured: boolean;
};

const badgeConfig: Record<string, { icon: typeof Star; color: string; bg: string; description: string; popular?: boolean }> = {
  free: {
    icon: Star,
    color: 'text-neutral-400',
    bg: 'bg-neutral-100 dark:bg-neutral-500/10',
    description: 'Platformu keşfet, ilk tekliflerini ver.',
  },
  basic: {
    icon: Zap,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    description: 'Temel satis takibi isteyen saticilar icin yalın baslangic paketi.',
  },
  plus: {
    icon: Crown,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    description: 'Trendler ve kategori kirilimlariyla buyumek isteyen ekipler icin.',
    popular: true,
  },
  pro: {
    icon: Shield,
    color: 'text-accent',
    bg: 'bg-accent-lighter dark:bg-accent/10',
    description: 'Gelismis raporlama ve yonetim isteyen profesyoneller icin.',
  },
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('tr-TR').format(price);
}

function planFeatures(plan: Plan) {
  return [
    {
      text: `Ayda ${plan.offersPerMonth === null ? 'sınırsız' : plan.offersPerMonth} teklif hakkı`,
      included: true,
    },
    {
      text:
        plan.boostPerMonth === null
          ? 'Sınırsız öne çıkarma'
          : plan.boostPerMonth > 0
            ? `Ayda ${plan.boostPerMonth} öne çıkarma`
            : 'Teklif öne çıkarma',
      included: plan.boostPerMonth === null || plan.boostPerMonth > 0,
    },
    {
      text: `${plan.responseTime || 'Standart'} destek yanıt süresi`,
      included: true,
    },
    {
      text: analyticsTierFeatureTitle(plan.analyticsTier),
      included: plan.analyticsTier !== 'none',
    },
    {
      text: 'Öncelikli destek',
      included: plan.prioritySupport,
    },
    {
      text: 'Doğrulanmış rozet',
      included: plan.verifiedBadge,
    },
    {
      text: 'Özel profil sayfası',
      included: Boolean(plan.customProfile),
    },
  ];
}

export default function PricingPage() {
  const { data: session } = useSession();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [snapshot, setSnapshot] = useState<BillingSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      try {
        const [plansRes, billingRes] = await Promise.all([
          fetch('/api/plans', { cache: 'no-store' }),
          session?.user?.id
            ? fetch('/api/billing/subscription', { cache: 'no-store' })
            : Promise.resolve(null),
        ]);

        const plansData = await plansRes.json().catch(() => []);
        const billingData = billingRes ? await billingRes.json().catch(() => null) : null;

        if (!alive) return;
        setPlans(Array.isArray(plansData) ? plansData.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)) : []);
        setSnapshot(billingData);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [session?.user?.id]);

  const currentBadge = snapshot?.currentPlan?.slug || (session?.user as Record<string, string> | undefined)?.badge || 'free';
  const comparisonPlans = useMemo(() => plans, [plans]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="text-center mb-12">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary mb-3"
        >
          İşletmenize Uygun Planı Seçin
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-body-lg text-neutral-500 max-w-2xl mx-auto mb-8"
        >
          Planları gerçek verilerle karşılaştırın, ardından iyzico ile güvenli ödeme akışından
          aboneliğinizi başlatın veya yükseltin.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="inline-flex items-center gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-dark-surfaceRaised"
        >
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-5 py-2.5 rounded-lg text-body-md font-medium transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white dark:bg-dark-surface text-neutral-900 dark:text-dark-textPrimary shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Aylık
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-5 py-2.5 rounded-lg text-body-md font-medium transition-all flex items-center gap-2 ${
              billingCycle === 'yearly'
                ? 'bg-white dark:bg-dark-surface text-neutral-900 dark:text-dark-textPrimary shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Yıllık
            <span className="text-[11px] font-bold text-success bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
              2 ay avantaj
            </span>
          </button>
        </motion.div>
      </div>

      {!snapshot?.iyzicoConfigured && (
        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-body-md text-amber-900">
          Bu ortamda iyzico anahtarları tanımlı değil. Planları inceleyebilirsin ama checkout
          başlatılamaz.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
        {plans.map((plan, index) => {
          const config = badgeConfig[plan.slug] || badgeConfig.free;
          const Icon = config.icon;
          const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
          const isCurrentPlan = currentBadge === plan.slug;
          const isConfigured =
            plan.slug === 'free' ||
            Boolean(billingCycle === 'monthly' ? plan.iyzicoMonthlyPlanRef : plan.iyzicoYearlyPlanRef);
          const canProceed = isCurrentPlan || (snapshot?.iyzicoConfigured && isConfigured);

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.08 }}
              className={`relative flex flex-col rounded-2xl border p-6 transition-shadow hover:shadow-lg ${
                config.popular
                  ? 'border-accent/40 bg-accent/[0.02] dark:bg-accent/[0.03] shadow-md ring-1 ring-accent/20'
                  : 'border-neutral-200/50 dark:border-dark-border bg-white dark:bg-dark-surface'
              }`}
            >
              {config.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent text-white text-[11px] font-bold rounded-full uppercase tracking-wide">
                  En Popüler
                </div>
              )}

              <div className={`w-11 h-11 rounded-xl ${config.bg} flex items-center justify-center mb-4`}>
                <Icon size={22} className={config.color} />
              </div>
              <h3 className="text-h3 font-bold text-neutral-900 dark:text-dark-textPrimary mb-1">
                {plan.name}
              </h3>
              <p className="text-body-sm text-neutral-500 mb-5">{config.description}</p>

              <div className="mb-6">
                {price === 0 ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-neutral-900 dark:text-dark-textPrimary">Ücretsiz</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-neutral-900 dark:text-dark-textPrimary">
                      ₺{formatPrice(price)}
                    </span>
                    <span className="text-body-sm text-neutral-400">
                      /{billingCycle === 'monthly' ? 'ay' : 'yıl'}
                    </span>
                  </div>
                )}
                {billingCycle === 'yearly' && price > 0 && (
                  <p className="text-body-sm text-neutral-400 mt-1">
                    Aylık yaklaşık ₺{formatPrice(Math.round(price / 12))}
                  </p>
                )}
              </div>

              {isCurrentPlan ? (
                <div className="h-11 rounded-xl border-2 border-accent/30 bg-accent/5 text-accent text-body-md font-semibold flex items-center justify-center mb-6">
                  Mevcut Planınız
                </div>
              ) : (
                <Link
                  href={canProceed ? `/subscription?plan=${plan.slug}&cycle=${billingCycle}` : '/subscription'}
                  className={`h-11 rounded-xl text-body-md font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.97] mb-6 ${
                    canProceed
                      ? config.popular
                        ? 'bg-accent text-white hover:bg-accent-600 shadow-sm hover:shadow-md'
                        : 'bg-neutral-900 dark:bg-dark-surfaceRaised text-white dark:text-dark-textPrimary hover:bg-neutral-800 dark:hover:bg-dark-border'
                      : 'bg-neutral-200 dark:bg-dark-border text-neutral-500 cursor-not-allowed pointer-events-none'
                  }`}
                >
                  {canProceed ? 'Planı Seç' : 'Hazırlanıyor'}
                  {canProceed && <ArrowRight size={16} />}
                </Link>
              )}

              <div className="flex-1 space-y-3">
                {planFeatures(plan).map((feature) => (
                  <div key={feature.text} className="flex items-start gap-2.5">
                    {feature.included ? (
                      <Check size={16} className="text-success shrink-0 mt-0.5" />
                    ) : (
                      <X size={16} className="text-neutral-300 dark:text-neutral-600 shrink-0 mt-0.5" />
                    )}
                    <span
                      className={`text-body-sm ${
                        feature.included
                          ? 'text-neutral-700 dark:text-dark-textSecondary'
                          : 'text-neutral-400 dark:text-neutral-600'
                      }`}
                    >
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mb-16">
        <h2 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary text-center mb-8">
          Detaylı Plan Karşılaştırması
        </h2>
        <div className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-dark-border">
                  <th className="text-left text-body-sm font-semibold text-neutral-500 px-6 py-4 w-[240px]">Özellik</th>
                  {comparisonPlans.map((plan) => (
                    <th key={plan.id} className="text-center text-body-sm font-semibold text-neutral-900 dark:text-dark-textPrimary px-4 py-4">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <ComparisonRow
                  label="Aylık teklif hakkı"
                  icon={<MessageSquare size={14} />}
                  values={comparisonPlans.map((p) => (p.offersPerMonth === null ? 'Sınırsız' : String(p.offersPerMonth)))}
                />
                <ComparisonRow
                  label="Teklif öne çıkarma"
                  icon={<Zap size={14} />}
                  values={comparisonPlans.map((p) => {
                    if (p.boostPerMonth === null) return 'Sınırsız';
                    if (p.boostPerMonth === 0) return '—';
                    return `${p.boostPerMonth}/ay`;
                  })}
                />
                <ComparisonRow
                  label="Destek yanıt süresi"
                  icon={<Clock size={14} />}
                  values={comparisonPlans.map((p) => p.responseTime || 'Standart')}
                />
                <ComparisonRow
                  label="Analitik seviyesi"
                  icon={<BarChart3 size={14} />}
                  values={comparisonPlans.map((p) => analyticsTierShortValue(p.analyticsTier))}
                />
                <ComparisonRow
                  label="Öncelikli destek"
                  icon={<Shield size={14} />}
                  values={comparisonPlans.map((p) => p.prioritySupport)}
                />
                <ComparisonRow
                  label="Doğrulanmış rozet"
                  icon={<BadgeCheck size={14} />}
                  values={comparisonPlans.map((p) => p.verifiedBadge)}
                />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparisonRow({ label, icon, values }: { label: string; icon: React.ReactNode; values: (string | boolean)[] }) {
  return (
    <tr className="border-b border-neutral-50 dark:border-dark-border/50 last:border-0">
      <td className="px-6 py-3.5">
        <div className="flex items-center gap-2 text-body-sm text-neutral-700 dark:text-dark-textSecondary">
          <span className="text-neutral-400">{icon}</span>
          {label}
        </div>
      </td>
      {values.map((val, i) => (
        <td key={i} className="text-center px-4 py-3.5">
          {typeof val === 'boolean' ? (
            val ? (
              <Check size={18} className="text-success mx-auto" />
            ) : (
              <X size={18} className="text-neutral-300 dark:text-neutral-600 mx-auto" />
            )
          ) : (
            <span className="text-body-sm font-medium text-neutral-700 dark:text-dark-textSecondary">{val}</span>
          )}
        </td>
      ))}
    </tr>
  );
}
