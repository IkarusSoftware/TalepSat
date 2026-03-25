'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Crown, Shield, Zap, Star, CreditCard, Calendar,
  ArrowUpRight, Download, RotateCcw, Check, AlertTriangle,
  ChevronRight, BarChart3, Sparkles, Receipt,
} from 'lucide-react';
import { currentSubscription, subscriptionPlans } from '@/lib/mock-data';

function formatPrice(price: number) {
  return new Intl.NumberFormat('tr-TR').format(price);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

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

export default function SubscriptionPage() {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const plan = subscriptionPlans.find((p) => p.slug === currentSubscription.planSlug)!;
  const PlanIcon = planIcons[plan.slug];
  const colors = planColors[plan.slug];

  const daysLeft = Math.ceil(
    (new Date(currentSubscription.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const offersPercent = currentSubscription.offersLimit
    ? Math.round((currentSubscription.offersUsed / currentSubscription.offersLimit) * 100)
    : null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">Abonelik Yönetimi</h1>
          <p className="mt-1 text-body-lg text-neutral-500">Planınızı, kullanımınızı ve faturalarınızı yönetin.</p>
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
                  ₺{formatPrice(currentSubscription.billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice)}
                </p>
                <p className="text-body-sm text-neutral-400">
                  /{currentSubscription.billingCycle === 'monthly' ? 'ay' : 'yıl'}
                </p>
              </div>
            </div>

            {/* Period info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-dark-surfaceRaised">
                <Calendar size={18} className="text-neutral-400" />
                <div>
                  <p className="text-body-sm text-neutral-400">Dönem Başlangıcı</p>
                  <p className="text-body-md font-medium text-neutral-900 dark:text-dark-textPrimary">
                    {formatDate(currentSubscription.currentPeriodStart)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-dark-surfaceRaised">
                <Calendar size={18} className="text-neutral-400" />
                <div>
                  <p className="text-body-sm text-neutral-400">Yenileme Tarihi</p>
                  <p className="text-body-md font-medium text-neutral-900 dark:text-dark-textPrimary">
                    {formatDate(currentSubscription.currentPeriodEnd)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-dark-surfaceRaised">
                <RotateCcw size={18} className="text-neutral-400" />
                <div>
                  <p className="text-body-sm text-neutral-400">Kalan Süre</p>
                  <p className="text-body-md font-medium text-neutral-900 dark:text-dark-textPrimary">
                    {daysLeft} gün
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/pricing"
                className="h-10 px-5 rounded-xl bg-accent text-white text-body-md font-semibold flex items-center gap-2 hover:bg-accent-600 active:scale-[0.97] transition-all"
              >
                <Sparkles size={16} />
                Planı Yükselt
              </Link>
              <button
                onClick={() => setShowCancelModal(true)}
                className="h-10 px-5 rounded-xl border border-neutral-200 dark:border-dark-border text-body-md font-medium text-neutral-500 hover:text-error hover:border-red-200 dark:hover:border-red-500/30 transition-colors"
              >
                Aboneliği İptal Et
              </button>
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
                  <span className="text-body-md text-neutral-700 dark:text-dark-textSecondary">Teklif Hakkı</span>
                  <span className="text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary">
                    {currentSubscription.offersUsed}
                    {currentSubscription.offersLimit ? ` / ${currentSubscription.offersLimit}` : ' (Sınırsız)'}
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

              {/* Boosts usage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-body-md text-neutral-700 dark:text-dark-textSecondary">Öne Çıkarma</span>
                  <span className="text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary">
                    {currentSubscription.boostsUsed}
                    {currentSubscription.boostsLimit >= 999 ? ' (Sınırsız)' : ` / ${currentSubscription.boostsLimit}`}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-neutral-100 dark:bg-dark-surfaceRaised overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: currentSubscription.boostsLimit >= 999 ? '8%' : `${Math.min((currentSubscription.boostsUsed / currentSubscription.boostsLimit) * 100, 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                    className="h-full rounded-full bg-blue-400"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Invoices */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.16 }}
            className="rounded-2xl border border-neutral-200/50 dark:border-dark-border bg-white dark:bg-dark-surface p-6"
          >
            <h3 className="text-h3 font-bold text-neutral-900 dark:text-dark-textPrimary mb-5 flex items-center gap-2">
              <Receipt size={20} className="text-neutral-400" />
              Fatura Geçmişi
            </h3>

            <div className="space-y-2">
              {currentSubscription.invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-dark-surfaceRaised flex items-center justify-center">
                      <Receipt size={16} className="text-neutral-400" />
                    </div>
                    <div>
                      <p className="text-body-md font-medium text-neutral-900 dark:text-dark-textPrimary">{inv.description}</p>
                      <p className="text-body-sm text-neutral-400">{formatDate(inv.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary">₺{formatPrice(inv.amount)}</p>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        inv.status === 'paid'
                          ? 'text-success bg-emerald-50 dark:bg-emerald-500/10'
                          : inv.status === 'pending'
                            ? 'text-amber-600 bg-amber-50 dark:bg-amber-500/10'
                            : 'text-error bg-red-50 dark:bg-red-500/10'
                      }`}>
                        {inv.status === 'paid' ? 'Ödendi' : inv.status === 'pending' ? 'Bekliyor' : 'Başarısız'}
                      </span>
                    </div>
                    <button className="p-2 rounded-lg text-neutral-300 hover:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-dark-surfaceRaised transition-colors opacity-0 group-hover:opacity-100">
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Payment method */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="rounded-2xl border border-neutral-200/50 dark:border-dark-border bg-white dark:bg-dark-surface p-6"
          >
            <h3 className="text-h4 font-bold text-neutral-900 dark:text-dark-textPrimary mb-4 flex items-center gap-2">
              <CreditCard size={18} className="text-neutral-400" />
              Ödeme Yöntemi
            </h3>

            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-dark-surfaceRaised border border-neutral-100 dark:border-dark-border mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-7 rounded bg-gradient-to-r from-blue-600 to-blue-400 flex items-center justify-center">
                  <span className="text-white text-[9px] font-bold tracking-wider">VISA</span>
                </div>
                <div>
                  <p className="text-body-md font-medium text-neutral-900 dark:text-dark-textPrimary">
                    •••• •••• •••• {currentSubscription.paymentMethod.last4}
                  </p>
                  <p className="text-body-sm text-neutral-400">
                    Son kullanma: {String(currentSubscription.paymentMethod.expiryMonth).padStart(2, '0')}/{currentSubscription.paymentMethod.expiryYear}
                  </p>
                </div>
              </div>
            </div>

            <button className="w-full h-9 rounded-lg border border-neutral-200 dark:border-dark-border text-body-sm font-medium text-neutral-600 dark:text-dark-textSecondary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors">
              Kartı Değiştir
            </button>
          </motion.div>

          {/* Auto-renewal */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="rounded-2xl border border-neutral-200/50 dark:border-dark-border bg-white dark:bg-dark-surface p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-h4 font-bold text-neutral-900 dark:text-dark-textPrimary">Otomatik Yenileme</h3>
              <div className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${
                currentSubscription.autoRenew ? 'bg-success' : 'bg-neutral-200 dark:bg-dark-border'
              }`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${
                  currentSubscription.autoRenew ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`} />
              </div>
            </div>
            <p className="text-body-sm text-neutral-500">
              {currentSubscription.autoRenew
                ? `Aboneliğiniz ${formatDate(currentSubscription.currentPeriodEnd)} tarihinde otomatik olarak yenilenecektir.`
                : 'Otomatik yenileme kapalı. Aboneliğiniz dönem sonunda sona erecektir.'}
            </p>
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
                <span className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">Fatura Bilgileri</span>
              </div>
              <ChevronRight size={16} className="text-neutral-400" />
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Cancel modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-dark-surface rounded-2xl border border-neutral-200 dark:border-dark-border shadow-2xl max-w-md w-full p-6"
          >
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
              <AlertTriangle size={24} className="text-error" />
            </div>
            <h3 className="text-h3 font-bold text-neutral-900 dark:text-dark-textPrimary mb-2">
              Aboneliği iptal et?
            </h3>
            <p className="text-body-md text-neutral-500 mb-6">
              İptal etmeniz durumunda mevcut dönem sonuna kadar ({formatDate(currentSubscription.currentPeriodEnd)})
              tüm özelliklerden yararlanmaya devam edersiniz. Sonrasında ücretsiz plana düşürülürsünüz.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 h-11 rounded-xl border border-neutral-200 dark:border-dark-border text-body-md font-medium text-neutral-700 dark:text-dark-textSecondary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors"
              >
                Vazgeç
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 h-11 rounded-xl bg-error text-white text-body-md font-semibold hover:bg-red-600 active:scale-[0.97] transition-all"
              >
                İptal Et
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
