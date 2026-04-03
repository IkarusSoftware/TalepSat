'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Check,
  Clock,
  Crown,
  Loader2,
  MessageSquare,
  Shield,
  Star,
  X,
  Zap,
} from 'lucide-react';
import { analyticsTierFeatureTitle, analyticsTierShortValue } from '../../../../../../shared/plan-analytics';

type BillingCycle = 'monthly' | 'yearly';

type Plan = {
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

const planAppearance: Record<string, { icon: typeof Star; accent: string; surface: string; description: string; featured?: boolean }> = {
  free: {
    icon: Star,
    accent: 'text-neutral-500',
    surface: 'bg-neutral-100 dark:bg-neutral-500/10',
    description: 'Platformu tanimak ve temel akislari kullanmak icin.',
  },
  basic: {
    icon: Zap,
    accent: 'text-blue-500',
    surface: 'bg-blue-50 dark:bg-blue-500/10',
    description: 'Temel satis takibi isteyen saticilar icin yaln bir paket.',
  },
  plus: {
    icon: Crown,
    accent: 'text-amber-500',
    surface: 'bg-amber-50 dark:bg-amber-500/10',
    description: 'Trendler, kirilimlar ve daha guclu karar desteği icin.',
    featured: true,
  },
  pro: {
    icon: Shield,
    accent: 'text-accent',
    surface: 'bg-accent-lighter dark:bg-accent/10',
    description: 'Gelişmis raporlama, filtreleme ve yonetim akislari icin.',
  },
};

function formatPrice(value: number) {
  return new Intl.NumberFormat('tr-TR').format(value);
}

function featureRows(plan: Plan) {
  return [
    { label: `Aylik teklif hakki: ${plan.offersPerMonth === null ? 'Sinirsiz' : plan.offersPerMonth}`, enabled: true },
    { label: plan.boostPerMonth === null ? 'Sinirsiz one cikarma' : plan.boostPerMonth > 0 ? `Ayda ${plan.boostPerMonth} one cikarma` : 'One cikarma', enabled: plan.boostPerMonth === null || plan.boostPerMonth > 0 },
    { label: plan.responseTime || 'Standart destek suresi', enabled: true },
    { label: analyticsTierFeatureTitle(plan.analyticsTier), enabled: plan.analyticsTier !== 'none' },
    { label: 'Oncelikli destek', enabled: plan.prioritySupport },
    { label: 'Dogrulanmis rozet', enabled: plan.verifiedBadge },
    { label: 'Ozel profil sayfasi', enabled: Boolean(plan.customProfile) },
  ];
}

function getPlanAvailability(plan: Plan, cycle: BillingCycle, snapshot: BillingSnapshot | null, isCurrentPlan: boolean) {
  if (isCurrentPlan) {
    return { href: `/subscription?plan=${plan.slug}&cycle=${cycle}`, label: 'Mevcut Plan', blockedReason: null };
  }

  if (plan.slug === 'free') {
    return { href: `/subscription?plan=${plan.slug}&cycle=${cycle}`, label: 'Free Plana Bak', blockedReason: null };
  }

  if (!snapshot?.iyzicoConfigured) {
    return { href: '/subscription', label: 'Inceleme Modu', blockedReason: 'Iyzico bu ortamda kapali.' };
  }

  const planRef = cycle === 'monthly' ? plan.iyzicoMonthlyPlanRef : plan.iyzicoYearlyPlanRef;
  if (!planRef) {
    return {
      href: '/subscription',
      label: 'Referans Eksik',
      blockedReason: `Bu planin ${cycle === 'monthly' ? 'aylik' : 'yillik'} checkout referansi henuz tanimli degil.`,
    };
  }

  return { href: `/subscription?plan=${plan.slug}&cycle=${cycle}`, label: 'Plani Sec', blockedReason: null };
}

export default function PricingPage() {
  const { data: session } = useSession();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [snapshot, setSnapshot] = useState<BillingSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.all([
      fetch('/api/plans', { cache: 'no-store' }).then((res) => res.json().catch(() => [])),
      session?.user?.id
        ? fetch('/api/billing/subscription', { cache: 'no-store' }).then((res) => res.json().catch(() => null))
        : Promise.resolve(null),
    ])
      .then(([plansData, billingData]) => {
        if (!active) return;
        const nextPlans = Array.isArray(plansData)
          ? plansData.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
          : [];
        setPlans(nextPlans);
        setSnapshot(billingData);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  const currentPlanSlug = snapshot?.currentPlan?.slug || (session?.user as Record<string, string> | undefined)?.badge || 'free';
  const comparisonPlans = useMemo(() => plans, [plans]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-12 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-3 text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary"
        >
          Isletmene Uygun Plani Sec
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="mx-auto mb-8 max-w-2xl text-body-lg text-neutral-500"
        >
          Planlari gercek verilerle karsilastir. Odeme hazir degilse bile tum farklari gorup inceleme modunda karar verebilirsin.
        </motion.p>

        <div className="inline-flex items-center gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-dark-surfaceRaised">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`rounded-lg px-5 py-2.5 text-body-md font-medium transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white text-neutral-900 shadow-sm dark:bg-dark-surface dark:text-dark-textPrimary'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Aylik
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-body-md font-medium transition-all ${
              billingCycle === 'yearly'
                ? 'bg-white text-neutral-900 shadow-sm dark:bg-dark-surface dark:text-dark-textPrimary'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Yillik
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-success dark:bg-emerald-500/10">
              2 ay avantaj
            </span>
          </button>
        </div>
      </div>

      {!snapshot?.iyzicoConfigured && (
        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-body-md text-amber-900">
          Bu ortamda iyzico anahtarlari tanimli degil. Kartlar inceleme modunda calisiyor; checkout acilmaz.
        </div>
      )}

      <div className="mb-16 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan, index) => {
          const appearance = planAppearance[plan.slug] || planAppearance.free;
          const Icon = appearance.icon;
          const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
          const isCurrentPlan = currentPlanSlug === plan.slug;
          const availability = getPlanAvailability(plan, billingCycle, snapshot, isCurrentPlan);

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.08 + index * 0.05 }}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                appearance.featured
                  ? 'border-accent/40 bg-accent/[0.02] ring-1 ring-accent/20 dark:bg-accent/[0.03]'
                  : 'border-neutral-200/50 bg-white dark:border-dark-border dark:bg-dark-surface'
              }`}
            >
              {appearance.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                  En Populer
                </div>
              )}

              <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${appearance.surface}`}>
                <Icon size={22} className={appearance.accent} />
              </div>
              <h3 className="mb-1 text-h3 font-bold text-neutral-900 dark:text-dark-textPrimary">{plan.name}</h3>
              <p className="mb-5 text-body-sm text-neutral-500">{appearance.description}</p>

              <div className="mb-6">
                {price === 0 ? (
                  <span className="text-3xl font-bold text-neutral-900 dark:text-dark-textPrimary">Ucretsiz</span>
                ) : (
                  <>
                    <span className="text-3xl font-bold text-neutral-900 dark:text-dark-textPrimary">₺{formatPrice(price)}</span>
                    <span className="ml-1 text-body-sm text-neutral-400">/{billingCycle === 'monthly' ? 'ay' : 'yil'}</span>
                    {billingCycle === 'yearly' && (
                      <p className="mt-1 text-body-sm text-neutral-400">Aylik yaklasik ₺{formatPrice(Math.round(price / 12))}</p>
                    )}
                  </>
                )}
              </div>

              <Link
                href={availability.href}
                className={`mb-3 flex h-11 items-center justify-center gap-2 rounded-xl text-body-md font-semibold transition-all ${
                  availability.blockedReason
                    ? 'bg-neutral-200 text-neutral-500 dark:bg-dark-border'
                    : isCurrentPlan
                      ? 'border-2 border-accent/30 bg-accent/5 text-accent'
                      : appearance.featured
                        ? 'bg-accent text-white hover:bg-accent-600'
                        : 'bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-dark-surfaceRaised dark:text-dark-textPrimary dark:hover:bg-dark-border'
                }`}
              >
                {availability.label}
                {!availability.blockedReason && !isCurrentPlan && <ArrowRight size={16} />}
              </Link>

              {availability.blockedReason && (
                <p className="mb-4 text-body-sm text-neutral-500">{availability.blockedReason}</p>
              )}

              <div className="flex-1 space-y-3">
                {featureRows(plan).map((feature) => (
                  <div key={feature.label} className="flex items-start gap-2.5">
                    {feature.enabled ? (
                      <Check size={16} className="mt-0.5 shrink-0 text-success" />
                    ) : (
                      <X size={16} className="mt-0.5 shrink-0 text-neutral-300 dark:text-neutral-600" />
                    )}
                    <span className={`text-body-sm ${feature.enabled ? 'text-neutral-700 dark:text-dark-textSecondary' : 'text-neutral-400 dark:text-neutral-600'}`}>
                      {feature.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mb-16">
        <h2 className="mb-8 text-center text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary">Detayli Karsilastirma</h2>
        <div className="overflow-hidden rounded-xl border border-neutral-200/50 bg-white dark:border-dark-border dark:bg-dark-surface">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-dark-border">
                  <th className="w-[240px] px-6 py-4 text-left text-body-sm font-semibold text-neutral-500">Ozellik</th>
                  {comparisonPlans.map((plan) => (
                    <th key={plan.id} className="px-4 py-4 text-center text-body-sm font-semibold text-neutral-900 dark:text-dark-textPrimary">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <ComparisonRow label="Aylik teklif hakki" icon={<MessageSquare size={14} />} values={comparisonPlans.map((plan) => plan.offersPerMonth === null ? 'Sinirsiz' : String(plan.offersPerMonth))} />
                <ComparisonRow label="One cikarma" icon={<Zap size={14} />} values={comparisonPlans.map((plan) => plan.boostPerMonth === null ? 'Sinirsiz' : plan.boostPerMonth === 0 ? '—' : `${plan.boostPerMonth}/ay`)} />
                <ComparisonRow label="Destek suresi" icon={<Clock size={14} />} values={comparisonPlans.map((plan) => plan.responseTime || 'Standart')} />
                <ComparisonRow label="Analitik seviyesi" icon={<BarChart3 size={14} />} values={comparisonPlans.map((plan) => analyticsTierShortValue(plan.analyticsTier))} />
                <ComparisonRow label="Oncelikli destek" icon={<Shield size={14} />} values={comparisonPlans.map((plan) => plan.prioritySupport)} />
                <ComparisonRow label="Dogrulanmis rozet" icon={<BadgeCheck size={14} />} values={comparisonPlans.map((plan) => plan.verifiedBadge)} />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparisonRow({
  label,
  icon,
  values,
}: {
  label: string;
  icon: JSX.Element;
  values: Array<string | boolean>;
}) {
  return (
    <tr className="border-b border-neutral-50 last:border-0 dark:border-dark-border/50">
      <td className="px-6 py-3.5">
        <div className="flex items-center gap-2 text-body-sm text-neutral-700 dark:text-dark-textSecondary">
          <span className="text-neutral-400">{icon}</span>
          {label}
        </div>
      </td>
      {values.map((value, index) => (
        <td key={index} className="px-4 py-3.5 text-center">
          {typeof value === 'boolean' ? (
            value ? (
              <Check size={18} className="mx-auto text-success" />
            ) : (
              <X size={18} className="mx-auto text-neutral-300 dark:text-neutral-600" />
            )
          ) : (
            <span className="text-body-sm font-medium text-neutral-700 dark:text-dark-textSecondary">{value}</span>
          )}
        </td>
      ))}
    </tr>
  );
}
