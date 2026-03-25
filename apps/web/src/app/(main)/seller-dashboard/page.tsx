'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  TrendingUp, CheckCircle, Star, Banknote,
  ArrowRight, ExternalLink, Clock, ArrowRightLeft,
} from 'lucide-react';
import { mockOffers, currentUser } from '@/lib/mock-data';
import { OfferStatusBadge } from '@/components/offers/offer-status-badge';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Az önce';
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
}

export default function SellerDashboardPage() {
  const myOffers = useMemo(() => {
    return mockOffers.filter((o) => o.sellerId === currentUser.sellerId);
  }, []);

  const stats = useMemo(() => {
    const total = myOffers.length;
    const accepted = myOffers.filter((o) => o.status === 'accepted').length;
    const pending = myOffers.filter((o) => o.status === 'pending').length;
    const counterOffered = myOffers.filter((o) => o.status === 'counter_offered').length;
    const totalEarnings = myOffers.filter((o) => o.status === 'accepted').reduce((sum, o) => sum + o.price, 0);
    const acceptRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
    return { total, accepted, pending, counterOffered, totalEarnings, acceptRate };
  }, [myOffers]);

  const recentOffers = useMemo(() => {
    return [...myOffers].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);
  }, [myOffers]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">
          Satıcı Paneli
        </h1>
        <p className="mt-2 text-body-lg text-neutral-500">
          Teklif performansını takip et, kazancını gör.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Aktif Teklifler', value: stats.pending.toString(), icon: Clock, color: 'text-amber-600 dark:text-amber-400', iconBg: 'bg-amber-50 dark:bg-amber-500/10' },
          { label: 'Kabul Oranı', value: `%${stats.acceptRate}`, icon: CheckCircle, color: 'text-success', iconBg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'Toplam Kazanç', value: formatCurrency(stats.totalEarnings), icon: Banknote, color: 'text-accent', iconBg: 'bg-accent-lighter dark:bg-accent/10' },
          { label: 'Ortalama Puan', value: '4.9', icon: Star, color: 'text-amber-500', iconBg: 'bg-amber-50 dark:bg-amber-500/10' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border/80 p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon size={20} className={stat.color} />
              </div>
            </div>
            <p className="text-body-sm text-neutral-500 mb-1">{stat.label}</p>
            <p className={`text-h2 font-bold ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left — Recent Offers (3/5) */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h3 font-semibold text-neutral-900 dark:text-dark-textPrimary">
              Son Teklifler
            </h2>
            <Link href="/offers" className="text-body-sm font-semibold text-accent hover:text-accent-600 transition-colors flex items-center gap-1">
              Tümünü Gör <ArrowRight size={14} />
            </Link>
          </div>

          <div className="space-y-3">
            {recentOffers.map((offer, index) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border/80 p-4 hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-500 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-primary-lighter dark:bg-primary/20 text-primary dark:text-blue-300 text-body-sm font-medium rounded-sm">
                        {offer.listingCategory}
                      </span>
                      <OfferStatusBadge status={offer.status} />
                    </div>
                    <Link
                      href={`/offers/${offer.id}`}
                      className="text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary hover:text-accent transition-colors line-clamp-1 block"
                    >
                      {offer.listingTitle}
                    </Link>
                    <p className="text-body-sm text-neutral-400 mt-1">{timeAgo(offer.updatedAt)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-body-lg font-bold text-accent">{formatCurrency(offer.price)}</p>
                    <p className="text-body-sm text-neutral-400">{offer.deliveryDays} gün</p>
                  </div>
                </div>

                {offer.status === 'counter_offered' && offer.counterOffer && (
                  <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-dark-border flex items-center gap-2">
                    <ArrowRightLeft size={14} className="text-blue-500" />
                    <span className="text-body-sm text-blue-600 dark:text-blue-400 font-medium">
                      Karşı teklif: {formatCurrency(offer.counterOffer.price)}
                    </span>
                    <Link href={`/offers/${offer.id}`} className="ml-auto text-body-sm text-accent font-semibold hover:text-accent-600 transition-colors">
                      Yanıtla
                    </Link>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right — Performance (2/5) */}
        <div className="lg:col-span-2 space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.4 }}
            className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border/80 p-6"
          >
            <h3 className="text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary mb-5 flex items-center gap-2">
              <TrendingUp size={18} className="text-accent" />
              Performans Özeti
            </h3>

            <div className="space-y-4">
              {/* Acceptance rate bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-body-sm text-neutral-500">Kabul Oranı</span>
                  <span className="text-body-sm font-bold text-neutral-900 dark:text-dark-textPrimary">%{stats.acceptRate}</span>
                </div>
                <div className="w-full h-2.5 bg-neutral-100 dark:bg-dark-surfaceRaised rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.acceptRate}%` }}
                    transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
                    className="h-full bg-success rounded-full"
                  />
                </div>
              </div>

              {/* Response rate bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-body-sm text-neutral-500">Yanıt Hızı</span>
                  <span className="text-body-sm font-bold text-neutral-900 dark:text-dark-textPrimary">%92</span>
                </div>
                <div className="w-full h-2.5 bg-neutral-100 dark:bg-dark-surfaceRaised rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '92%' }}
                    transition={{ duration: 0.8, delay: 0.7, ease: 'easeOut' }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </div>

              {/* Stats list */}
              <div className="pt-4 border-t border-neutral-100 dark:border-dark-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-body-md text-neutral-500">Toplam Teklif</span>
                  <span className="text-body-md font-bold text-neutral-900 dark:text-dark-textPrimary">{stats.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body-md text-neutral-500">Kabul Edilen</span>
                  <span className="text-body-md font-bold text-success">{stats.accepted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body-md text-neutral-500">Karşı Teklif Bekleyen</span>
                  <span className="text-body-md font-bold text-blue-600 dark:text-blue-400">{stats.counterOffered}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body-md text-neutral-500">Tamamlanan İş</span>
                  <span className="text-body-md font-bold text-neutral-900 dark:text-dark-textPrimary">234</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.5 }}
            className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border/80 p-5"
          >
            <h3 className="text-body-md font-semibold text-neutral-700 dark:text-dark-textPrimary mb-3">Hızlı İşlemler</h3>
            <div className="space-y-2">
              <Link href="/explore" className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors">
                <ExternalLink size={16} className="text-accent" />
                <span className="text-body-md text-neutral-700 dark:text-dark-textPrimary">Yeni İlanları Keşfet</span>
              </Link>
              <Link href="/offers" className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors">
                <Clock size={16} className="text-amber-500" />
                <span className="text-body-md text-neutral-700 dark:text-dark-textPrimary">Bekleyen Teklifleri Gör</span>
              </Link>
              <Link href="/settings" className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors">
                <Star size={16} className="text-primary" />
                <span className="text-body-md text-neutral-700 dark:text-dark-textPrimary">Profil Ayarları</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
