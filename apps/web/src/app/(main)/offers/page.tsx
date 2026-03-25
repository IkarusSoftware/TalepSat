'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  FileText, ChevronDown, Clock, MapPin, Star,
  CheckCircle, ExternalLink, Undo2, ArrowRightLeft,
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

const tabs = [
  { value: 'all', label: 'Tümü' },
  { value: 'pending', label: 'Bekleyen' },
  { value: 'accepted', label: 'Kabul Edilen' },
  { value: 'rejected', label: 'Reddedilen' },
  { value: 'counter_offered', label: 'Karşı Teklif' },
  { value: 'withdrawn', label: 'Geri Çekilen' },
];

const sortOptions = [
  { value: 'newest', label: 'En Yeni' },
  { value: 'oldest', label: 'En Eski' },
  { value: 'price-high', label: 'Fiyat (Azalan)' },
  { value: 'price-low', label: 'Fiyat (Artan)' },
];

export default function MyOffersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Filter offers for the current seller
  const myOffers = useMemo(() => {
    let result = mockOffers.filter((o) => o.sellerId === currentUser.sellerId);

    if (activeTab !== 'all') {
      result = result.filter((o) => o.status === activeTab);
    }

    switch (sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [activeTab, sortBy]);

  const tabCounts = useMemo(() => {
    const all = mockOffers.filter((o) => o.sellerId === currentUser.sellerId);
    return {
      all: all.length,
      pending: all.filter((o) => o.status === 'pending').length,
      accepted: all.filter((o) => o.status === 'accepted').length,
      rejected: all.filter((o) => o.status === 'rejected').length,
      counter_offered: all.filter((o) => o.status === 'counter_offered').length,
      withdrawn: all.filter((o) => o.status === 'withdrawn').length,
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">
          Tekliflerim
        </h1>
        <p className="mt-2 text-body-lg text-neutral-500">
          Gönderdiğin teklifleri takip et ve yönet.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-6 -mx-1 px-1">
        {tabs.map((tab) => {
          const count = tabCounts[tab.value as keyof typeof tabCounts];
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`shrink-0 px-4 py-2.5 rounded-lg text-body-md font-medium transition-colors ${
                activeTab === tab.value
                  ? 'bg-primary text-white'
                  : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-dark-surfaceRaised'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`ml-1.5 text-body-sm ${activeTab === tab.value ? 'text-white/70' : 'text-neutral-400'}`}>
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sort + Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-body-md text-neutral-500">
          <strong className="text-neutral-700 dark:text-dark-textPrimary">{myOffers.length}</strong> teklif
        </p>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 pl-4 pr-9 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-body-md text-neutral-700 dark:text-dark-textPrimary appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
        </div>
      </div>

      {/* Offer cards */}
      {myOffers.length > 0 ? (
        <div className="space-y-4">
          {myOffers.map((offer, index) => (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border/80 p-5 hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-500 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Left: Listing context */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-primary-lighter dark:bg-primary/20 text-primary dark:text-blue-300 text-body-sm font-medium rounded-sm">
                      {offer.listingCategory}
                    </span>
                    <OfferStatusBadge status={offer.status} />
                  </div>

                  <Link
                    href={`/listing/${offer.listingId}`}
                    className="text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary hover:text-accent transition-colors line-clamp-2 mb-2 block"
                  >
                    {offer.listingTitle}
                  </Link>

                  <div className="flex flex-wrap items-center gap-3 text-body-sm text-neutral-400">
                    <span className="flex items-center gap-1">
                      <MapPin size={13} /> {offer.listingCity}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} /> {timeAgo(offer.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Right: Offer details */}
                <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1 shrink-0">
                  <div className="text-right">
                    <p className="text-body-sm text-neutral-400">Teklifin</p>
                    <p className="text-h3 font-bold text-accent">{formatCurrency(offer.price)}</p>
                  </div>
                  <p className="text-body-sm text-neutral-500">{offer.deliveryDays} gün teslimat</p>
                </div>
              </div>

              {/* Counter offer info */}
              {offer.status === 'counter_offered' && offer.counterOffer && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-100 dark:border-blue-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowRightLeft size={14} className="text-blue-600 dark:text-blue-400" />
                    <p className="text-body-sm font-semibold text-blue-600 dark:text-blue-400">Alıcıdan Karşı Teklif</p>
                  </div>
                  <p className="text-body-md font-bold text-blue-700 dark:text-blue-300">
                    {formatCurrency(offer.counterOffer.price)}
                    {offer.counterOffer.deliveryDays && ` · ${offer.counterOffer.deliveryDays} gün teslimat`}
                  </p>
                  {offer.counterOffer.note && (
                    <p className="text-body-sm text-blue-600/80 dark:text-blue-400/80 mt-1 line-clamp-2">{offer.counterOffer.note}</p>
                  )}
                </div>
              )}

              {/* Rejected reason */}
              {offer.status === 'rejected' && offer.rejectedReason && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-500/10 rounded-lg border border-red-100 dark:border-red-500/20">
                  <p className="text-body-sm text-red-600 dark:text-red-400">
                    <strong>Red sebebi:</strong> {offer.rejectedReason}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-dark-border flex items-center gap-3">
                <Link
                  href={`/offers/${offer.id}`}
                  className="h-9 px-4 rounded-lg border border-neutral-200 dark:border-dark-border text-body-sm font-medium text-neutral-600 dark:text-dark-textSecondary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors flex items-center gap-2"
                >
                  <ExternalLink size={14} /> Detay
                </Link>
                {offer.status === 'pending' && (
                  <button className="h-9 px-4 rounded-lg border border-neutral-200 dark:border-dark-border text-body-sm font-medium text-neutral-500 hover:bg-neutral-50 hover:text-error transition-colors flex items-center gap-2">
                    <Undo2 size={14} /> Geri Çek
                  </button>
                )}
                {offer.status === 'counter_offered' && (
                  <Link
                    href={`/offers/${offer.id}`}
                    className="h-9 px-4 rounded-lg bg-accent text-white text-body-sm font-semibold hover:bg-accent-600 transition-colors flex items-center gap-2"
                  >
                    <ArrowRightLeft size={14} /> Karşı Teklifi Yanıtla
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral-100 dark:bg-dark-surfaceRaised flex items-center justify-center">
            <FileText size={28} className="text-neutral-400" />
          </div>
          <h3 className="text-h3 font-semibold text-neutral-700 dark:text-dark-textPrimary mb-2">
            Bu kategoride teklifin yok
          </h3>
          <p className="text-body-lg text-neutral-500 mb-6">
            İlanları keşfet ve ilk teklifini ver!
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 h-11 px-6 bg-accent text-white text-body-md font-semibold rounded-lg hover:bg-accent-600 transition-colors"
          >
            İlanları Keşfet
          </Link>
        </div>
      )}
    </div>
  );
}
