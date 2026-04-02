'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Crown,
  Shield,
  Zap,
  Star,
  CreditCard,
  ArrowUpRight,
  ChevronRight,
  BarChart3,
  Sparkles,
  Loader2,
  AlertTriangle,
  RefreshCcw,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
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
    description: 'Başlamak ve temel görünürlük kazanmak için ideal giriş planı.',
  },
  basic: {
    text: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    border: 'border-blue-200 dark:border-blue-500/30',
    description: 'Temel satis takibi isteyen saticilar icin hizli baslangic paketi.',
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
    description: 'Gelismis raporlama, filtreler ve export isteyen profesyoneller icin.',
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

function featureList(plan: Plan) {
  return [
    `Aylık ${plan.offersPerMonth === null ? 'sınırsız' : plan.offersPerMonth} teklif hakkı`,
    `${plan.boostPerMonth === null ? 'Sınırsız' : plan.boostPerMonth} öne çıkarma`,
    `${plan.maxListings === null ? 'Sınırsız' : plan.maxListings} aktif ilan limiti`,
    `${plan.responseTime || 'Standart'} destek yanıt süresi`,
    plan.analyticsTier !== 'none' ? analyticsTierFeatureTitle(plan.analyticsTier) : null,
    plan.prioritySupport ? 'Öncelikli destek' : null,
    plan.verifiedBadge ? 'Doğrulanmış rozet' : null,
    plan.customProfile ? 'Özel profil sayfası' : null,
  ].filter(Boolean) as string[];
}

function statusLabel(status?: string | null) {
  switch (status) {
    case 'active':
      return 'Aktif';
    case 'pending':
      return 'Beklemede';
    case 'canceled':
      return 'İptal edildi';
    case 'past_due':
      return 'Ödeme bekliyor';
    case 'expired':
      return 'Sona erdi';
    default:
      return 'Free';
  }
}

export default function SubscriptionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPlanSlug = searchParams.get('plan');
  const selectedCycle = searchParams.get('cycle') === 'monthly' ? 'monthly' : 'yearly';
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
      const plansRes = await fetch('/api/plans', {
        cache: 'no-store',
        credentials: 'include',
      });

      const plansData = await plansRes.json().catch(() => []);

      if (!plansRes.ok) throw new Error('Plan verisi alınamadı.');
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
        ? await fetch(`/api/users/${sessionUser.id}`, {
            cache: 'no-store',
            credentials: 'include',
          })
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
        setError(`${billingData.error} Temel abonelik görünümü yüklendi.`);
      }
    } catch (err: any) {
      setError(err?.message || 'Abonelik verisi yüklenemedi.');
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

  const currentBadge = currentPlanSlug || 'free';
  const PlanIcon = planIcons[currentBadge] || Star;
  const colors = planColors[currentBadge] || planColors.free;

  async function handleCheckout() {
    if (!focusPlan) return;

    if (snapshot?.requiredProfileFields?.length) {
      setError(`Ödeme öncesi şu alanları tamamlamalısın: ${snapshot.requiredProfileFields.join(', ')}.`);
      router.push('/settings');
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
        throw new Error(data?.error || 'Checkout başlatılamadı.');
      }

      if (data.mode === 'noop') {
        await load();
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('Checkout bağlantısı oluşturulamadı.');
      }
    } catch (err: any) {
      setError(err?.message || 'Checkout başlatılamadı.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSubscriptionAction(mode: 'cancel' | 'resume') {
    setActionLoading(mode);
    setError(null);
    try {
      const res = await fetch(`/api/billing/${mode}`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'İşlem tamamlanamadı.');
      }
      await load();
    } catch (err: any) {
      setError(err?.message || 'İşlem tamamlanamadı.');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!currentPlan || !snapshot) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-body-md text-neutral-600">
          {error || 'Abonelik bilgisi şu an yüklenemedi.'}
        </div>
      </div>
    );
  }

  const offersLimit = currentPlan.offersPerMonth;
  const offersUsed = snapshot.usage.totalOffers || 0;
  const offersPercent = offersLimit ? Math.round((offersUsed / offersLimit) * 100) : null;
  const activeSubscription = snapshot.subscription;
  const planConfigured =
    focusPlan?.slug === 'free' ||
    Boolean(selectedCycle === 'monthly' ? focusPlan?.iyzicoMonthlyPlanRef : focusPlan?.iyzicoYearlyPlanRef);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">Abonelik Yönetimi</h1>
          <p className="mt-1 text-body-lg text-neutral-500">Planını ve kullanımını gerçek zamanlı olarak görüntüle.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => load()}
            className="hidden md:inline-flex items-center gap-2 h-10 px-5 rounded-xl border border-neutral-200 dark:border-dark-border text-body-md font-medium text-neutral-700 dark:text-dark-textSecondary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors"
          >
            <RefreshCcw size={16} />
            Yenile
          </button>
          <Link
            href="/pricing"
            className="hidden md:inline-flex items-center gap-2 h-10 px-5 rounded-xl border border-neutral-200 dark:border-dark-border text-body-md font-medium text-neutral-700 dark:text-dark-textSecondary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors"
          >
            Planları Karşılaştır
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
              ? 'Ödeme akışı başarıyla tamamlandı. Abonelik bilgilerin güncellendi.'
              : billingStatus === 'pending'
                ? 'Checkout tamamlandıktan sonra abonelik durumu birkaç saniye içinde güncellenecek.'
                : 'Ödeme akışı tamamlanamadı ya da geri dönüş alınamadı.')}
        </div>
      )}

      {!snapshot.iyzicoConfigured && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-body-md text-amber-900">
          Bu ortamda iyzico anahtarları tanımlı değil. Plan detaylarını görüntüleyebilirsin ancak ödeme başlatılamaz.
        </div>
      )}

      {snapshot.requiredProfileFields.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-body-md font-semibold text-amber-900">Checkout öncesi profilini tamamla</p>
              <p className="text-body-sm text-amber-800 mt-1">
                Gerekli alanlar: {snapshot.requiredProfileFields.join(', ')}. Bunları{' '}
                <Link href="/settings" className="underline font-semibold">
                  ayarlar
                </Link>{' '}
                sayfasından güncelleyebilirsin.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className={`rounded-2xl border ${colors.border} bg-white dark:bg-dark-surface p-6`}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl ${colors.bg} flex items-center justify-center`}>
                  <PlanIcon size={28} className={colors.text} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary">
                      {currentPlan.name} Plan
                    </h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${colors.bg} ${colors.text}`}>
                      {activeSubscription ? statusLabel(activeSubscription.status) : 'Ücretsiz'}
                    </span>
                  </div>
                  <p className="text-body-md text-neutral-500 mt-0.5">{colors.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-neutral-900 dark:text-dark-textPrimary">
                  {currentPlan.priceMonthly === 0 ? 'Ücretsiz' : `₺${new Intl.NumberFormat('tr-TR').format(currentPlan.priceMonthly)}`}
                </p>
                {currentPlan.priceMonthly > 0 && <p className="text-body-sm text-neutral-400">/ay</p>}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-100 dark:border-dark-border bg-neutral-50 dark:bg-dark-surfaceRaised p-4 mb-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-body-sm text-neutral-500">Dönem başlangıcı</p>
                  <p className="mt-1 text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary">
                    {formatDate(activeSubscription?.currentPeriodStart)}
                  </p>
                </div>
                <div>
                  <p className="text-body-sm text-neutral-500">Dönem sonu</p>
                  <p className="mt-1 text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary">
                    {formatDate(activeSubscription?.currentPeriodEnd)}
                  </p>
                </div>
                <div>
                  <p className="text-body-sm text-neutral-500">Yenileme durumu</p>
                  <p className="mt-1 text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary">
                    {activeSubscription ? (activeSubscription.cancelAtPeriodEnd ? 'Dönem sonunda kapanır' : 'Otomatik yenilenir') : 'Aktif abonelik yok'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {focusPlan && focusPlan.slug !== currentPlan.slug && focusPlan.slug !== 'free' && (
                <button
                  onClick={handleCheckout}
                  disabled={actionLoading === 'checkout' || !snapshot.iyzicoConfigured || !planConfigured}
                  className="h-10 px-5 rounded-xl bg-accent text-white text-body-md font-semibold flex items-center gap-2 hover:bg-accent-600 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === 'checkout' ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  iyzico ile Devam Et
                </button>
              )}

              {focusPlan?.slug === 'free' && focusPlan.slug !== currentPlan.slug && activeSubscription && !activeSubscription.cancelAtPeriodEnd && (
                <button
                  onClick={() => handleSubscriptionAction('cancel')}
                  disabled={actionLoading === 'cancel'}
                  className="h-10 px-5 rounded-xl border border-neutral-200 dark:border-dark-border text-body-md font-medium text-neutral-700 dark:text-dark-textSecondary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'cancel' ? 'İşleniyor...' : 'Dönem Sonunda Free Plana Dön'}
                </button>
              )}

              {activeSubscription && !activeSubscription.cancelAtPeriodEnd && (
                <button
                  onClick={() => handleSubscriptionAction('cancel')}
                  disabled={actionLoading === 'cancel'}
                  className="h-10 px-5 rounded-xl border border-neutral-200 dark:border-dark-border text-body-md font-medium text-neutral-700 dark:text-dark-textSecondary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'cancel' ? 'İşleniyor...' : 'Dönem Sonunda İptal Et'}
                </button>
              )}

              {activeSubscription?.cancelAtPeriodEnd && (
                <button
                  onClick={() => handleSubscriptionAction('resume')}
                  disabled={actionLoading === 'resume'}
                  className="h-10 px-5 rounded-xl border border-neutral-200 dark:border-dark-border text-body-md font-medium text-neutral-700 dark:text-dark-textSecondary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'resume' ? 'İşleniyor...' : 'İptali Geri Al'}
                </button>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            className="rounded-2xl border border-neutral-200/50 dark:border-dark-border bg-white dark:bg-dark-surface p-6"
          >
            <h3 className="text-h3 font-bold text-neutral-900 dark:text-dark-textPrimary mb-5 flex items-center gap-2">
              <BarChart3 size={20} className="text-neutral-400" />
              Kullanım
            </h3>

            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-body-md text-neutral-700 dark:text-dark-textSecondary">Toplam Teklif</span>
                  <span className="text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary">
                    {offersUsed}
                    {offersLimit ? ` / ${offersLimit}` : ' (Sınırsız)'}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-neutral-100 dark:bg-dark-surfaceRaised overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: offersPercent !== null ? `${Math.min(offersPercent, 100)}%` : '15%' }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${offersPercent !== null && offersPercent > 80 ? 'bg-amber-400' : 'bg-accent'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-neutral-100 dark:border-dark-border">
                <div className="text-center p-3 rounded-xl bg-neutral-50 dark:bg-dark-surfaceRaised">
                  <p className="text-h3 font-bold text-neutral-900 dark:text-dark-textPrimary">{snapshot.usage.listingCount || 0}</p>
                  <p className="text-body-sm text-neutral-500">İlan</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-neutral-50 dark:bg-dark-surfaceRaised">
                  <p className="text-h3 font-bold text-neutral-900 dark:text-dark-textPrimary">{snapshot.usage.acceptedOffers || 0}</p>
                  <p className="text-body-sm text-neutral-500">Kabul Edilen</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-neutral-50 dark:bg-dark-surfaceRaised">
                  <p className="text-h3 font-bold text-neutral-900 dark:text-dark-textPrimary">{snapshot.usage.reviewCount || 0}</p>
                  <p className="text-body-sm text-neutral-500">Değerlendirme</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="rounded-2xl border border-neutral-200/50 dark:border-dark-border bg-white dark:bg-dark-surface p-6"
          >
            <h3 className="text-h4 font-bold text-neutral-900 dark:text-dark-textPrimary mb-4 flex items-center gap-2">
              <Crown size={18} className="text-neutral-400" />
              Plan Özellikleri
            </h3>

            <div className="space-y-2.5">
              {featureList(focusPlan || currentPlan).map((feature) => (
                <div key={feature} className="flex items-center gap-2.5 text-body-sm text-neutral-700 dark:text-dark-textSecondary">
                  <div className="w-4 h-4 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-success" />
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
            className="rounded-2xl border border-neutral-200/50 dark:border-dark-border bg-white dark:bg-dark-surface p-6"
          >
            <h3 className="text-h4 font-bold text-neutral-900 dark:text-dark-textPrimary mb-4 flex items-center gap-2">
              <CreditCard size={18} className="text-neutral-400" />
              Ödeme
            </h3>

            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-dark-surfaceRaised border border-neutral-100 dark:border-dark-border">
              <p className="text-body-md text-neutral-700 dark:text-dark-textSecondary">
                {activeSubscription
                  ? `${statusLabel(activeSubscription.status)} • ${activeSubscription.billingCycle === 'yearly' ? 'Yıllık' : 'Aylık'} plan yönetimi`
                  : 'Henüz aktif ücretli abonelik bulunmuyor.'}
              </p>
              <p className="text-body-sm text-neutral-400 mt-2">
                Checkout güvenli iyzico sayfasında açılır. Ödeme sonrası bu ekrana geri dönerek durumu anında görebilirsin.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
            className="rounded-2xl border border-neutral-200/50 dark:border-dark-border bg-white dark:bg-dark-surface p-4"
          >
            <Link
              href="/pricing"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors"
            >
              <div className="flex items-center gap-3">
                <Sparkles size={18} className="text-accent" />
                <span className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">Planları Karşılaştır</span>
              </div>
              <ChevronRight size={16} className="text-neutral-400" />
            </Link>
            <Link
              href="/settings"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors"
            >
              <div className="flex items-center gap-3">
                <CreditCard size={18} className="text-neutral-400" />
                <span className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">Hesap Ayarları</span>
              </div>
              <ChevronRight size={16} className="text-neutral-400" />
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
