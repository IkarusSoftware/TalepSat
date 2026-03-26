'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Check, X, Zap, Crown, Star, ArrowRight, Shield,
  BarChart3, Clock, MessageSquare, BadgeCheck,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { subscriptionPlans } from '@/lib/mock-data';

const badgeConfig: Record<string, { icon: typeof Star; color: string; bg: string }> = {
  free: { icon: Star, color: 'text-neutral-400', bg: 'bg-neutral-100 dark:bg-neutral-500/10' },
  basic: { icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  plus: { icon: Crown, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  pro: { icon: Shield, color: 'text-accent', bg: 'bg-accent-lighter dark:bg-accent/10' },
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('tr-TR').format(price);
}

export default function PricingPage() {
  const { data: session } = useSession();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const currentBadge = (session?.user as Record<string, string> | undefined)?.badge || 'free';

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Hero */}
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
          TalepSat ile daha fazla talebe ulaşın, tekliflerinizi öne çıkarın ve işinizi büyütün.
          Tüm planlar 14 gün ücretsiz deneme ile başlar.
        </motion.p>

        {/* Billing toggle */}
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
              2 ay bedava
            </span>
          </button>
        </motion.div>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
        {subscriptionPlans.map((plan, index) => {
          const config = badgeConfig[plan.slug];
          const Icon = config.icon;
          const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
          const isCurrentPlan = currentBadge === plan.slug;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.08 }}
              className={`relative flex flex-col rounded-2xl border p-6 transition-shadow hover:shadow-lg ${
                plan.popular
                  ? 'border-accent/40 bg-accent/[0.02] dark:bg-accent/[0.03] shadow-md ring-1 ring-accent/20'
                  : 'border-neutral-200/50 dark:border-dark-border bg-white dark:bg-dark-surface'
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent text-white text-[11px] font-bold rounded-full uppercase tracking-wide">
                  En Popüler
                </div>
              )}

              {/* Plan icon & name */}
              <div className={`w-11 h-11 rounded-xl ${config.bg} flex items-center justify-center mb-4`}>
                <Icon size={22} className={config.color} />
              </div>
              <h3 className="text-h3 font-bold text-neutral-900 dark:text-dark-textPrimary mb-1">
                {plan.name}
              </h3>
              <p className="text-body-sm text-neutral-500 mb-5">{plan.description}</p>

              {/* Price */}
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
                    Aylık ₺{formatPrice(Math.round(price / 12))}
                  </p>
                )}
              </div>

              {/* CTA */}
              {isCurrentPlan ? (
                <div className="h-11 rounded-xl border-2 border-accent/30 bg-accent/5 text-accent text-body-md font-semibold flex items-center justify-center mb-6">
                  Mevcut Planınız
                </div>
              ) : (
                <Link
                  href="/subscription"
                  className={`h-11 rounded-xl text-body-md font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.97] mb-6 ${
                    plan.popular
                      ? 'bg-accent text-white hover:bg-accent-600 shadow-sm hover:shadow-md'
                      : 'bg-neutral-900 dark:bg-dark-surfaceRaised text-white dark:text-dark-textPrimary hover:bg-neutral-800 dark:hover:bg-dark-border'
                  }`}
                >
                  {price === 0 ? 'Ücretsiz Başla' : 'Planı Seç'}
                  <ArrowRight size={16} />
                </Link>
              )}

              {/* Features */}
              <div className="flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature.text} className="flex items-start gap-2.5">
                    {feature.included ? (
                      <Check size={16} className="text-success shrink-0 mt-0.5" />
                    ) : (
                      <X size={16} className="text-neutral-300 dark:text-neutral-600 shrink-0 mt-0.5" />
                    )}
                    <span className={`text-body-sm ${
                      feature.included
                        ? 'text-neutral-700 dark:text-dark-textSecondary'
                        : 'text-neutral-400 dark:text-neutral-600'
                    }`}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Comparison table */}
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
                  {subscriptionPlans.map((plan) => (
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
                  values={subscriptionPlans.map((p) => p.limits.offersPerMonth === null ? 'Sınırsız' : String(p.limits.offersPerMonth))}
                />
                <ComparisonRow
                  label="Teklif öne çıkarma"
                  icon={<Zap size={14} />}
                  values={subscriptionPlans.map((p) => p.limits.boostPerMonth === 0 ? '—' : p.limits.boostPerMonth >= 999 ? 'Sınırsız' : `${p.limits.boostPerMonth}/ay`)}
                />
                <ComparisonRow
                  label="Destek yanıt süresi"
                  icon={<Clock size={14} />}
                  values={subscriptionPlans.map((p) => p.limits.responseTime)}
                />
                <ComparisonRow
                  label="Analitik & raporlama"
                  icon={<BarChart3 size={14} />}
                  values={subscriptionPlans.map((p) => p.limits.analytics)}
                />
                <ComparisonRow
                  label="Öncelikli destek"
                  icon={<Shield size={14} />}
                  values={subscriptionPlans.map((p) => p.limits.prioritySupport)}
                />
                <ComparisonRow
                  label="Doğrulanmış rozet"
                  icon={<BadgeCheck size={14} />}
                  values={subscriptionPlans.map((p) => p.limits.verifiedBadge)}
                />
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary text-center mb-8">
          Sıkça Sorulan Sorular
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * i }}
              className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border p-5"
            >
              <h4 className="text-body-lg font-semibold text-neutral-900 dark:text-dark-textPrimary mb-2">{faq.q}</h4>
              <p className="text-body-md text-neutral-500">{faq.a}</p>
            </motion.div>
          ))}
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

const faqs = [
  {
    q: 'Planımı istediğim zaman değiştirebilir miyim?',
    a: 'Evet, planınızı istediğiniz zaman yükseltebilir veya düşürebilirsiniz. Yükseltmelerde fark anında tahsil edilir, düşürmelerde kalan süre krediye dönüştürülür.',
  },
  {
    q: '14 günlük deneme süresi nasıl çalışıyor?',
    a: 'Ücretli planlarda ilk 14 gün ücretsizdir. Bu süre içinde iptal ederseniz herhangi bir ücret alınmaz. Deneme süresi sonunda otomatik olarak seçtiğiniz plan aktifleşir.',
  },
  {
    q: 'Alıcılar için ücret var mı?',
    a: 'Hayır! TalepSat\'ta ilan oluşturmak ve teklif almak tamamen ücretsizdir. Abonelik planları yalnızca satıcılar (teklif verenler) içindir.',
  },
  {
    q: 'Hangi ödeme yöntemlerini kabul ediyorsunuz?',
    a: 'Visa, Mastercard, American Express kredi/banka kartları ile ödeme yapabilirsiniz. Yıllık planlarda havale/EFT seçeneği de mevcuttur.',
  },
  {
    q: 'Faturamı nasıl alabilirim?',
    a: 'Tüm faturalarınız abonelik yönetim panelinden otomatik olarak oluşturulur ve e-posta adresinize gönderilir. Geçmiş faturalara da buradan erişebilirsiniz.',
  },
];
