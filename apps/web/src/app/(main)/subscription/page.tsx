'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Crown, Shield, Zap, Star, CreditCard, Calendar,
  ArrowUpRight, RotateCcw,
  ChevronRight, BarChart3, Sparkles, Loader2,
} from 'lucide-react';
import { subscriptionPlans } from '@/lib/mock-data';

const planIcons: Record<string, typeof Star> = {
  free: Star,
  basic: Zap,
  plus: Crown,
  pro: Shield,
};

const planColors: Record<string, { text: string; bg: string; border: string }> = {
  free: { text: 'text-neutral-500', bg: 'bg-neutral-100 dark:bg-neutral-500/10', border: 'border-neutral-200' },
  basic: { text: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/30' },
  plus: { text: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/30' },
  pro: { text: 'text-accent', bg: 'bg-accent-lighter dark:bg-accent/10', border: 'border-accent/30' },
};

interface UsageData {
  listingCount: number;
  totalOffers: number;
  acceptedOffers: number;
  reviewCount: number;
}

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  const currentBadge = (session?.user as Record<string, string> | undefined)?.badge || 'free';
  const plan = subscriptionPlans.find((p) => p.slug === currentBadge) || subscriptionPlans[0];
  const PlanIcon = planIcons[currentBadge] || Star;
  const colors = planColors[currentBadge] || planColors.free;

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/users/${session.user.id}`)
      .then((r) => r.json())
      .then((data) => {
        setUsage({
          listingCount: data.listingCount || 0,
          totalOffers: data.totalOffers || 0,
          acceptedOffers: data.acceptedOffers || 0,
          reviewCount: data.reviewCount || 0,
        });
      })
      .finally(() => setLoading(false));
  }, [session?.user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const offersLimit = plan.limits.offersPerMonth;
  const offersUsed = usage?.totalOffers || 0;
  const offersPercent = offersLimit ? Math.round((offersUsed / offersLimit) * 100) : null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">Abonelik Yönetimi</h1>
          <p className="mt-1 text-body-lg text-neutral-500">Planınızı ve kullanımınızı görüntüleyin.</p>
        </div>
        <Link
          href="/pricing"
          className="hidden md:inline-flex items-center gap-2 h-10 px-5 rounded-xl border border-neutral-200 dark:border-dark-border text-body-md font-medium text-neutral-700 dark:text-dark-textSecondary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors"
        >
          Planları Karşılaştır
          <ArrowUpRight size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current plan card */}
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
                    <h2 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary">{plan.name} Plan</h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${colors.bg} ${colors.text}`}>
                      Aktif
                    </span>
                  </div>
                  <p className="text-body-md text-neutral-500 mt-0.5">{plan.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-neutral-900 dark:text-dark-textPrimary">
                  {plan.monthlyPrice === 0 ? 'Ücretsiz' : `₺${new Intl.NumberFormat('tr-TR').format(plan.monthlyPrice)}`}
                </p>
                {plan.monthlyPrice > 0 && (
                  <p className="text-body-sm text-neutral-400">/ay</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/pricing"
                className="h-10 px-5 rounded-xl bg-accent text-white text-body-md font-semibold flex items-center gap-2 hover:bg-accent-600 active:scale-[0.97] transition-all"
              >
                <Sparkles size={16} />
                {currentBadge === 'pro' ? 'Plan Detayları' : 'Planı Yükselt'}
              </Link>
            </div>
          </motion.div>

          {/* Usage stats */}
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
              {/* Offers usage */}
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
                    className={`h-full rounded-full ${
                      offersPercent !== null && offersPercent > 80 ? 'bg-amber-400' : 'bg-accent'
                    }`}
                  />
                </div>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-neutral-100 dark:border-dark-border">
                <div className="text-center p-3 rounded-xl bg-neutral-50 dark:bg-dark-surfaceRaised">
                  <p className="text-h3 font-bold text-neutral-900 dark:text-dark-textPrimary">{usage?.listingCount || 0}</p>
                  <p className="text-body-sm text-neutral-500">İlan</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-neutral-50 dark:bg-dark-surfaceRaised">
                  <p className="text-h3 font-bold text-neutral-900 dark:text-dark-textPrimary">{usage?.acceptedOffers || 0}</p>
                  <p className="text-body-sm text-neutral-500">Kabul Edilen</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-neutral-50 dark:bg-dark-surfaceRaised">
                  <p className="text-h3 font-bold text-neutral-900 dark:text-dark-textPrimary">{usage?.reviewCount || 0}</p>
                  <p className="text-body-sm text-neutral-500">Değerlendirme</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Plan features */}
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
              {plan.features.filter(f => f.included).map((feature) => (
                <div key={feature.text} className="flex items-center gap-2.5 text-body-sm text-neutral-700 dark:text-dark-textSecondary">
                  <div className="w-4 h-4 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  </div>
                  {feature.text}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Payment info placeholder */}
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

            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-dark-surfaceRaised border border-neutral-100 dark:border-dark-border text-center">
              <p className="text-body-md text-neutral-500 mb-2">
                Ödeme entegrasyonu yakında aktif olacak.
              </p>
              <p className="text-body-sm text-neutral-400">
                Plan yükseltme ve ödeme işlemleri için lütfen bizimle iletişime geçin.
              </p>
            </div>
          </motion.div>

          {/* Quick links */}
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
