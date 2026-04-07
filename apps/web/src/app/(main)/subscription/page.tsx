'use client';

import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  CreditCard,
  Crown,
  Loader2,
  RefreshCcw,
  Shield,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';
import { analyticsTierFeatureTitle } from '../../../../../../shared/plan-analytics';

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
  badge: string | null;
  currentPlan: Plan | null;
  subscription: {
    id: string;
    status: string;
    billingCycle: BillingCycle | string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    plan: Plan;
  } | null;
  usage: {
    listingCount: number;
    totalOffers: number;
    acceptedOffers: number;
    reviewCount: number;
  };
  requiredProfileFields: string[];
  iyzicoConfigured: boolean;
};

const planIcons: Record<string, typeof Star> = {
  free: Star,
  basic: Zap,
  plus: Crown,
  pro: Shield,
};

const planColors: Record<string, { text: string; bg: string; border: string; description: string }> = {
  free: {
    text: 'text-neutral-500',
    bg: 'bg-neutral-100 dark:bg-neutral-500/10',
    border: 'border-neutral-200',
    description: 'Baslangic ve temel gorunurluk icin.',
  },
  basic: {
    text: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    border: 'border-blue-200 dark:border-blue-500/30',
    description: 'Temel satis takibi isteyen saticilar icin yaln bir paket.',
  },
  plus: {
    text: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    border: 'border-amber-200 dark:border-amber-500/30',
    description: 'Trendler ve kirilimlarla karar vermek isteyen ekipler icin.',
  },
  pro: {
    text: 'text-accent',
    bg: 'bg-accent-lighter dark:bg-accent/10',
    border: 'border-accent/30',
    description: 'Gelişmis raporlama ve export ihtiyaci olanlar icin.',
  },
};

function formatDate(value?: string | null) {
  if (!value) return 'Belirlenmedi';
  return new Date(value).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function statusLabel(status?: string | null) {
  switch (status) {
    case 'active':
      return 'Aktif';
    case 'pending':
      return 'Beklemede';
    case 'canceled':
      return 'Iptal edildi';
    case 'past_due':
      return 'Odeme bekliyor';
    case 'expired':
      return 'Sona erdi';
    default:
      return 'Free';
  }
}

function featureList(plan: Plan) {
  return [
    `Aylik ${plan.offersPerMonth === null ? 'sinirsiz' : plan.offersPerMonth} teklif hakki`,
    `${plan.boostPerMonth === null ? 'Sinirsiz' : plan.boostPerMonth} one cikarma`,
    `${plan.maxListings === null ? 'Sinirsiz' : plan.maxListings} aktif ilan limiti`,
    `${plan.responseTime || 'Standart'} destek suresi`,
    plan.analyticsTier !== 'none' ? analyticsTierFeatureTitle(plan.analyticsTier) : null,
    plan.prioritySupport ? 'Oncelikli destek' : null,
    plan.verifiedBadge ? 'Dogrulanmis rozet' : null,
    plan.customProfile ? 'Ozel profil sayfasi' : null,
  ].filter(Boolean) as string[];
}

function getCheckoutBlockReason(snapshot: BillingSnapshot, focusPlan: Plan | null, currentPlanSlug: string, cycle: BillingCycle) {
  if (!focusPlan || focusPlan.slug === currentPlanSlug || focusPlan.slug === 'free') {
    return null;
  }

  if (snapshot.requiredProfileFields.length > 0) {
    return `Checkout icin once su alanlari tamamla: ${snapshot.requiredProfileFields.join(', ')}.`;
  }

  if (!snapshot.iyzicoConfigured) {
    return 'Bu ortamda iyzico tanimli degil. Ekran inceleme modunda calisiyor.';
  }

  const planReference = cycle === 'monthly' ? focusPlan.iyzicoMonthlyPlanRef : focusPlan.iyzicoYearlyPlanRef;
  if (!planReference) {
    return `Secili ${cycle === 'monthly' ? 'aylik' : 'yillik'} donem icin plan referansi henuz tanimli degil.`;
  }

  return null;
}

function SubscriptionPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPlanSlug = searchParams.get('plan');
  const selectedCycle: BillingCycle = searchParams.get('cycle') === 'monthly' ? 'monthly' : 'yearly';
  const billingStatus = searchParams.get('billing');

  const [plans, setPlans] = useState<Plan[]>([]);
  const [snapshot, setSnapshot] = useState<BillingSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<'checkout' | 'cancel' | 'resume' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const sessionUser = session?.user as Record<string, string | null | undefined> | undefined;
    const fallbackBadge = sessionUser?.badge || 'free';

    setLoading(true);
    setError(null);
    try {
      const plansRes = await fetch('/api/plans', { cache: 'no-store', credentials: 'include' });
      const plansData = await plansRes.json().catch(() => []);
      const sortedPlans = Array.isArray(plansData)
        ? plansData.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        : [];
      setPlans(sortedPlans);

      const billingRes = await fetch('/api/billing/subscription', {
        cache: 'no-store',
        credentials: 'include',
      });
      const billingData = await billingRes.json().catch(() => null);

      if (billingRes.ok && billingData) {
        setSnapshot(billingData);
        return;
      }

      const profileRes = sessionUser?.id
        ? await fetch(`/api/users/${sessionUser.id}`, { cache: 'no-store', credentials: 'include' })
        : null;
      const profileData = profileRes ? await profileRes.json().catch(() => null) : null;
      const fallbackPlan = sortedPlans.find((item) => item.slug === fallbackBadge) || sortedPlans[0] || null;

      setSnapshot({
        badge: fallbackBadge,
        currentPlan: fallbackPlan,
        subscription: null,
        usage: {
          listingCount: profileData?.listingCount || 0,
          totalOffers: profileData?.totalOffers || 0,
          acceptedOffers: profileData?.acceptedOffers || 0,
          reviewCount: profileData?.reviewCount || 0,
        },
        requiredProfileFields: [
          !profileData?.phone ? 'phone' : null,
          !profileData?.city ? 'city' : null,
          !profileData?.taxNumber ? 'taxNumber' : null,
        ].filter(Boolean) as string[],
        iyzicoConfigured: false,
      });

      if (billingData?.error && billingData.error !== 'Yetkisiz') {
        setError(`${billingData.error} Temel gorunumle devam edildi.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Abonelik verisi yuklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return;
    load();
  }, [load, session?.user?.id, status]);

  const currentPlanSlug = snapshot?.currentPlan?.slug || (session?.user as Record<string, string> | undefined)?.badge || 'free';
  const currentPlan = useMemo(
    () => plans.find((item) => item.slug === currentPlanSlug) || snapshot?.currentPlan || null,
    [currentPlanSlug, plans, snapshot?.currentPlan],
  );
  const selectedPlan = useMemo(
    () => plans.find((item) => item.slug === selectedPlanSlug) || null,
    [plans, selectedPlanSlug],
  );
  const focusPlan = selectedPlan || currentPlan;
  const effectiveSnapshot: BillingSnapshot | null = snapshot
    ? snapshot
    : currentPlan
      ? {
          badge: currentPlanSlug,
          currentPlan,
          subscription: null,
          usage: { listingCount: 0, totalOffers: 0, acceptedOffers: 0, reviewCount: 0 },
          requiredProfileFields: [],
          iyzicoConfigured: false,
        }
      : null;

  const currentBadge = currentPlanSlug || 'free';
  const PlanIcon = planIcons[currentBadge] || Star;
  const colors = planColors[currentBadge] || planColors.free;

  async function handleCheckout() {
    if (!focusPlan || !effectiveSnapshot) return;

    const blockReason = getCheckoutBlockReason(effectiveSnapshot, focusPlan, currentPlanSlug, selectedCycle);
    if (blockReason) {
      setError(blockReason);
      if (effectiveSnapshot.requiredProfileFields.length > 0) {
        router.push('/settings');
      }
      return;
    }

    setActionLoading('checkout');
    setError(null);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planSlug: focusPlan.slug,
          billingCycle: selectedCycle,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Checkout baslatilamadi.');
      }

      if (data.mode === 'noop') {
        await load();
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      throw new Error('Checkout baglantisi olusturulamadi.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout baslatilamadi.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSubscriptionAction(mode: 'cancel' | 'resume') {
    setActionLoading(mode);
    setError(null);
    try {
      const res = await fetch(`/api/billing/${mode}`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Islem tamamlanamadi.');
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Islem tamamlanamadi.');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!plans.length || !currentPlan || !effectiveSnapshot) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-dark-border dark:bg-dark-surface">
          <h2 className="text-h3 font-semibold text-neutral-900 dark:text-dark-textPrimary">Abonelik paneli acilamadi</h2>
          <p className="mt-2 text-body-md text-neutral-600 dark:text-dark-textSecondary">
            {error || 'Plan verisi gelmedigi icin bu ekrani guvenli gorunumde acamadik.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => load()}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-200 px-4 text-body-md font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-dark-border dark:text-dark-textSecondary dark:hover:bg-dark-surfaceRaised"
            >
              <RefreshCcw size={16} />
              Yenile
            </button>
            <Link
              href="/pricing"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-body-md font-semibold text-white transition-colors hover:bg-accent-600"
            >
              Planlari ac
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const checkoutBlockReason = getCheckoutBlockReason(effectiveSnapshot, focusPlan, currentPlanSlug, selectedCycle);
  const offersLimit = currentPlan.offersPerMonth;
  const offersUsed = effectiveSnapshot.usage.totalOffers || 0;
  const offersPercent = offersLimit ? Math.round((offersUsed / offersLimit) * 100) : null;
  const activeSubscription = effectiveSnapshot.subscription;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">Abonelik Yonetimi</h1>
          <p className="mt-1 text-body-lg text-neutral-500">Planini, kullanimini ve checkout hazirlik durumunu tek ekranda gor.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => load()}
            className="hidden h-10 items-center gap-2 rounded-xl border border-neutral-200 px-5 text-body-md font-medium text-neutral-700 transition-colors hover:bg-neutral-50 md:inline-flex dark:border-dark-border dark:text-dark-textSecondary dark:hover:bg-dark-surfaceRaised"
          >
            <RefreshCcw size={16} />
            Yenile
          </button>
          <Link
            href="/pricing"
            className="hidden h-10 items-center gap-2 rounded-xl border border-neutral-200 px-5 text-body-md font-medium text-neutral-700 transition-colors hover:bg-neutral-50 md:inline-flex dark:border-dark-border dark:text-dark-textSecondary dark:hover:bg-dark-surfaceRaised"
          >
            Planlari Karsilastir
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>

      {(billingStatus || error) && (
        <div
          className={`mb-6 rounded-2xl border px-5 py-4 text-body-md ${
            billingStatus === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : billingStatus === 'pending'
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-rose-200 bg-rose-50 text-rose-900'
          }`}
        >
          {error ||
            (billingStatus === 'success'
              ? 'Odeme akisiniz tamamlandi. Abonelik durumu guncelleniyor.'
              : billingStatus === 'pending'
                ? 'Checkout tamamlandiysa abonelik durumu birkac saniye icinde guncellenecek.'
                : 'Odeme akisindan net bir geri donus alinmadi.')}
        </div>
      )}

      {!effectiveSnapshot.iyzicoConfigured && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-body-md text-amber-900">
          Iyzico bu ortamda tanimli degil. Panel inceleme modunda calisir, checkout acilmaz.
        </div>
      )}

      {effectiveSnapshot.requiredProfileFields.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
            <div>
              <p className="text-body-md font-semibold text-amber-900">Checkout oncesi profilini tamamla</p>
              <p className="mt-1 text-body-sm text-amber-800">
                Gerekli alanlar: {effectiveSnapshot.requiredProfileFields.join(', ')}. Bunlari{' '}
                <Link href="/settings" className="font-semibold underline">
                  ayarlar
                </Link>{' '}
                sayfasindan guncelleyebilirsin.
              </p>
            </div>
          </div>
        </div>
      )}

      {checkoutBlockReason && (
        <div className="mb-6 rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-4 text-body-md text-neutral-700 dark:border-dark-border dark:bg-dark-surfaceRaised dark:text-dark-textSecondary">
          {checkoutBlockReason}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className={`rounded-2xl border ${colors.border} bg-white p-6 dark:bg-dark-surface`}
          >
            <div className="mb-6 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${colors.bg}`}>
                  <PlanIcon size={28} className={colors.text} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary">{currentPlan.name} Plan</h2>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${colors.bg} ${colors.text}`}>
                      {activeSubscription ? statusLabel(activeSubscription.status) : 'Ucretsiz'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-body-md text-neutral-500">{colors.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-neutral-900 dark:text-dark-textPrimary">
                  {currentPlan.priceMonthly === 0 ? 'Ucretsiz' : `₺${new Intl.NumberFormat('tr-TR').format(currentPlan.priceMonthly)}`}
                </p>
                {currentPlan.priceMonthly > 0 && <p className="text-body-sm text-neutral-400">/ay</p>}
              </div>
            </div>

            <div className="mb-5 rounded-2xl border border-neutral-100 bg-neutral-50 p-4 dark:border-dark-border dark:bg-dark-surfaceRaised">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Metric label="Donem baslangici" value={formatDate(activeSubscription?.currentPeriodStart)} />
                <Metric label="Donem sonu" value={formatDate(activeSubscription?.currentPeriodEnd)} />
                <Metric
                  label="Yenileme durumu"
                  value={activeSubscription ? (activeSubscription.cancelAtPeriodEnd ? 'Donem sonunda kapanir' : 'Otomatik yenilenir') : 'Aktif abonelik yok'}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {focusPlan && focusPlan.slug !== currentPlan.slug && focusPlan.slug !== 'free' && (
                <button
                  onClick={handleCheckout}
                  disabled={actionLoading === 'checkout' || Boolean(checkoutBlockReason)}
                  className="flex h-10 items-center gap-2 rounded-xl bg-accent px-5 text-body-md font-semibold text-white transition-all hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading === 'checkout' ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  iyzico ile Devam Et
                </button>
              )}

              {focusPlan?.slug === 'free' && focusPlan.slug !== currentPlan.slug && activeSubscription && !activeSubscription.cancelAtPeriodEnd && (
                <button
                  onClick={() => handleSubscriptionAction('cancel')}
                  disabled={actionLoading === 'cancel'}
                  className="h-10 rounded-xl border border-neutral-200 px-5 text-body-md font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-dark-border dark:text-dark-textSecondary dark:hover:bg-dark-surfaceRaised"
                >
                  {actionLoading === 'cancel' ? 'Isleniyor...' : 'Donem Sonunda Free Plana Don'}
                </button>
              )}

              {activeSubscription && !activeSubscription.cancelAtPeriodEnd && (
                <button
                  onClick={() => handleSubscriptionAction('cancel')}
                  disabled={actionLoading === 'cancel'}
                  className="h-10 rounded-xl border border-neutral-200 px-5 text-body-md font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-dark-border dark:text-dark-textSecondary dark:hover:bg-dark-surfaceRaised"
                >
                  {actionLoading === 'cancel' ? 'Isleniyor...' : 'Donem Sonunda Iptal Et'}
                </button>
              )}

              {activeSubscription?.cancelAtPeriodEnd && (
                <button
                  onClick={() => handleSubscriptionAction('resume')}
                  disabled={actionLoading === 'resume'}
                  className="h-10 rounded-xl border border-neutral-200 px-5 text-body-md font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-dark-border dark:text-dark-textSecondary dark:hover:bg-dark-surfaceRaised"
                >
                  {actionLoading === 'resume' ? 'Isleniyor...' : 'Iptali Geri Al'}
                </button>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            className="rounded-2xl border border-neutral-200/50 bg-white p-6 dark:border-dark-border dark:bg-dark-surface"
          >
            <h3 className="mb-5 flex items-center gap-2 text-h3 font-bold text-neutral-900 dark:text-dark-textPrimary">
              <BarChart3 size={20} className="text-neutral-400" />
              Kullanim
            </h3>

            <div className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-body-md text-neutral-700 dark:text-dark-textSecondary">Toplam Teklif</span>
                  <span className="text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary">
                    {offersUsed}
                    {offersLimit ? ` / ${offersLimit}` : ' (Sinirsiz)'}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-dark-surfaceRaised">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: offersPercent !== null ? `${Math.min(offersPercent, 100)}%` : '15%' }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${offersPercent !== null && offersPercent > 80 ? 'bg-amber-400' : 'bg-accent'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-neutral-100 pt-3 dark:border-dark-border">
                <UsageCard value={effectiveSnapshot.usage.listingCount || 0} label="Ilan" />
                <UsageCard value={effectiveSnapshot.usage.acceptedOffers || 0} label="Kabul" />
                <UsageCard value={effectiveSnapshot.usage.reviewCount || 0} label="Degerlendirme" />
              </div>
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="rounded-2xl border border-neutral-200/50 bg-white p-6 dark:border-dark-border dark:bg-dark-surface"
          >
            <h3 className="mb-4 flex items-center gap-2 text-h4 font-bold text-neutral-900 dark:text-dark-textPrimary">
              <Crown size={18} className="text-neutral-400" />
              Plan Ozellikleri
            </h3>

            <div className="space-y-2.5">
              {featureList(focusPlan || currentPlan).map((feature) => (
                <div key={feature} className="flex items-center gap-2.5 text-body-sm text-neutral-700 dark:text-dark-textSecondary">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-success/10">
                    <div className="h-1.5 w-1.5 rounded-full bg-success" />
                  </div>
                  {feature}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="rounded-2xl border border-neutral-200/50 bg-white p-6 dark:border-dark-border dark:bg-dark-surface"
          >
            <h3 className="mb-4 flex items-center gap-2 text-h4 font-bold text-neutral-900 dark:text-dark-textPrimary">
              <CreditCard size={18} className="text-neutral-400" />
              Odeme Durumu
            </h3>

            <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4 dark:border-dark-border dark:bg-dark-surfaceRaised">
              <p className="text-body-md text-neutral-700 dark:text-dark-textSecondary">
                {activeSubscription
                  ? `${statusLabel(activeSubscription.status)} · ${activeSubscription.billingCycle === 'yearly' ? 'Yillik' : 'Aylik'} plan yonetimi`
                  : 'Henuz aktif ucretli abonelik bulunmuyor.'}
              </p>
              <p className="mt-2 text-body-sm text-neutral-400">
                Checkout guvenli iyzico sayfasinda acilir. Provider eksikse bu ekran salt okunur olarak calismaya devam eder.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
            className="rounded-2xl border border-neutral-200/50 bg-white p-4 dark:border-dark-border dark:bg-dark-surface"
          >
            <QuickLink href="/pricing" icon={<Sparkles size={18} className="text-accent" />} label="Planlari Karsilastir" />
            <QuickLink href="/settings" icon={<CreditCard size={18} className="text-neutral-400" />} label="Profil ve Fatura Bilgileri" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      }
    >
      <SubscriptionPageContent />
    </Suspense>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-body-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary">{value}</p>
    </div>
  );
}

function UsageCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-neutral-50 p-3 text-center dark:bg-dark-surfaceRaised">
      <p className="text-h3 font-bold text-neutral-900 dark:text-dark-textPrimary">{value}</p>
      <p className="text-body-sm text-neutral-500">{label}</p>
    </div>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised"
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">{label}</span>
      </div>
      <ChevronRight size={16} className="text-neutral-400" />
    </Link>
  );
}
