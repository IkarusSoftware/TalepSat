'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, ChevronRight, Star, CheckCircle, Sparkles,
  ArrowRightLeft, ChevronDown, Shield, Trophy,
} from 'lucide-react';
import { mockListings, mockOffers } from '@/lib/mock-data';
import { OfferStatusBadge } from '@/components/offers/offer-status-badge';
import { CounterOfferForm } from '@/components/offers/counter-offer-form';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);
}

const sortOptions = [
  { value: 'price-low', label: 'Fiyata Göre (Artan)' },
  { value: 'price-high', label: 'Fiyata Göre (Azalan)' },
  { value: 'delivery', label: 'Teslimat Süresine Göre' },
  { value: 'score', label: 'Puana Göre' },
];

export default function CompareOffersPage() {
  const params = useParams();
  const listing = mockListings.find((l) => l.id === params.id) || mockListings[0];
  const [sortBy, setSortBy] = useState('price-low');
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [showCounterForm, setShowCounterForm] = useState(false);

  const offers = useMemo(() => {
    const listingOffers = mockOffers.filter((o) => o.listingId === listing.id && o.status !== 'withdrawn' && o.status !== 'rejected');

    switch (sortBy) {
      case 'price-high':
        return [...listingOffers].sort((a, b) => b.price - a.price);
      case 'delivery':
        return [...listingOffers].sort((a, b) => a.deliveryDays - b.deliveryDays);
      case 'score':
        return [...listingOffers].sort((a, b) => b.sellerScore - a.sellerScore);
      default:
        return [...listingOffers].sort((a, b) => a.price - b.price);
    }
  }, [listing.id, sortBy]);

  // Find best values for highlighting
  const bestPrice = Math.min(...offers.map((o) => o.price));
  const bestDelivery = Math.min(...offers.map((o) => o.deliveryDays));
  const bestScore = Math.max(...offers.map((o) => o.sellerScore));

  const selectedOffer = offers.find((o) => o.id === selectedOfferId);

  const badgeLabel: Record<string, string> = { pro: 'Pro', plus: 'Plus', basic: 'Basic' };
  const badgeColor: Record<string, string> = {
    pro: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    plus: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-500/10 dark:text-neutral-400',
    basic: 'bg-neutral-50 text-neutral-500 dark:bg-neutral-500/10 dark:text-neutral-400',
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-body-sm text-neutral-400 mb-6">
        <Link href="/dashboard" className="flex items-center gap-1 hover:text-neutral-600 transition-colors">
          <ArrowLeft size={14} /> İlanlarım
        </Link>
        <ChevronRight size={14} />
        <Link href={`/listing/${listing.id}`} className="hover:text-neutral-600 transition-colors truncate max-w-[200px]">
          {listing.title}
        </Link>
        <ChevronRight size={14} />
        <span className="text-neutral-700 dark:text-dark-textPrimary">Karşılaştır</span>
      </div>

      {/* Listing summary bar */}
      <div className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border/80 p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-h3 font-bold text-neutral-900 dark:text-dark-textPrimary mb-1">
              Teklifleri Karşılaştır
            </h1>
            <p className="text-body-md text-neutral-500 line-clamp-1">{listing.title}</p>
          </div>
          <div className="flex items-center gap-3 text-body-md">
            <span className="text-accent font-bold">{formatCurrency(listing.budgetMin)} — {formatCurrency(listing.budgetMax)}</span>
            <span className="text-neutral-400">·</span>
            <span className="text-neutral-500">{offers.length} teklif</span>
          </div>
        </div>
      </div>

      {/* Sort */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-body-md text-neutral-500">
          Bir teklif seçerek işlem yapabilirsiniz.
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

      {/* Comparison cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-24">
        {offers.map((offer, index) => {
          const isSelected = selectedOfferId === offer.id;
          const isBestPrice = offer.price === bestPrice;
          const isBestDelivery = offer.deliveryDays === bestDelivery;
          const isBestScore = offer.sellerScore === bestScore;

          return (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.06 }}
              onClick={() => setSelectedOfferId(isSelected ? null : offer.id)}
              className={`relative cursor-pointer rounded-xl border p-5 transition-all duration-normal ${
                isSelected
                  ? 'border-accent bg-accent-lighter/20 dark:bg-accent/5 dark:border-accent/40 shadow-md ring-2 ring-accent/20'
                  : offer.isBoosted
                    ? 'border-accent/20 bg-accent-lighter/10 dark:bg-accent/5 dark:border-accent/15 hover:shadow-md'
                    : 'border-neutral-200/50 dark:border-dark-border/80 bg-white dark:bg-dark-surface hover:shadow-md hover:border-neutral-300'
              }`}
            >
              {/* Boosted badge */}
              {offer.isBoosted && (
                <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-accent text-white text-[11px] font-bold rounded-sm flex items-center gap-1">
                  <Sparkles size={10} /> Öne Çıkan
                </span>
              )}

              {/* Selection radio */}
              <div className="flex items-start gap-3 mb-4">
                <div className={`shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center transition-colors ${
                  isSelected ? 'border-accent bg-accent' : 'border-neutral-300 dark:border-dark-border'
                }`}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary truncate">
                      {offer.sellerName}
                    </h4>
                    {offer.sellerVerified && <CheckCircle size={14} className="text-success shrink-0" />}
                  </div>
                  {offer.sellerBadge && (
                    <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-bold rounded mt-1 ${badgeColor[offer.sellerBadge]}`}>
                      {badgeLabel[offer.sellerBadge]}
                    </span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-3">
                {/* Price */}
                <div className="flex items-center justify-between">
                  <span className="text-body-sm text-neutral-500">Fiyat</span>
                  <span className={`text-body-lg font-bold ${isBestPrice ? 'text-success' : 'text-neutral-900 dark:text-dark-textPrimary'}`}>
                    {formatCurrency(offer.price)}
                    {isBestPrice && <Trophy size={12} className="inline ml-1 text-success" />}
                  </span>
                </div>

                {/* Delivery */}
                <div className="flex items-center justify-between">
                  <span className="text-body-sm text-neutral-500">Teslimat</span>
                  <span className={`text-body-md font-semibold ${isBestDelivery ? 'text-success' : 'text-neutral-900 dark:text-dark-textPrimary'}`}>
                    {offer.deliveryDays} gün
                    {isBestDelivery && <Trophy size={12} className="inline ml-1 text-success" />}
                  </span>
                </div>

                {/* Score */}
                <div className="flex items-center justify-between">
                  <span className="text-body-sm text-neutral-500">Puan</span>
                  <span className={`flex items-center gap-1 text-body-md font-semibold ${isBestScore ? 'text-success' : 'text-neutral-900 dark:text-dark-textPrimary'}`}>
                    <Star size={13} className="text-amber-400 fill-amber-400" />
                    {offer.sellerScore}
                    {isBestScore && <Trophy size={12} className="text-success" />}
                  </span>
                </div>

                {/* Deals */}
                <div className="flex items-center justify-between">
                  <span className="text-body-sm text-neutral-500">Tamamlanan İş</span>
                  <span className="text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary">{offer.sellerCompletedDeals}</span>
                </div>

                {/* Verified */}
                <div className="flex items-center justify-between">
                  <span className="text-body-sm text-neutral-500">Doğrulanma</span>
                  {offer.sellerVerified ? (
                    <span className="flex items-center gap-1 text-body-sm font-medium text-success">
                      <Shield size={12} /> Doğrulanmış
                    </span>
                  ) : (
                    <span className="text-body-sm text-neutral-400">—</span>
                  )}
                </div>

                {/* Status */}
                <div className="pt-3 border-t border-neutral-100 dark:border-dark-border">
                  <OfferStatusBadge status={offer.status} />
                </div>
              </div>

              {/* Note preview */}
              <p className="mt-3 text-body-sm text-neutral-400 line-clamp-2">{offer.note}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Sticky action bar */}
      {selectedOfferId && selectedOffer && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-surface border-t border-neutral-200 dark:border-dark-border shadow-2xl z-30"
        >
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-body-sm shrink-0">
                {selectedOffer.sellerInitials}
              </div>
              <div className="min-w-0">
                <p className="text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary truncate">{selectedOffer.sellerName}</p>
                <p className="text-body-sm text-accent font-bold">{formatCurrency(selectedOffer.price)} · {selectedOffer.deliveryDays} gün</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href={`/offers/${selectedOffer.id}`}
                className="h-10 px-4 rounded-lg border border-neutral-200 dark:border-dark-border text-body-md font-medium text-neutral-600 dark:text-dark-textSecondary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors hidden sm:flex items-center gap-2"
              >
                Detay
              </Link>
              <button
                onClick={() => setShowCounterForm(true)}
                className="h-10 px-4 rounded-lg border border-accent text-accent text-body-md font-semibold hover:bg-accent-lighter/50 dark:hover:bg-accent/10 transition-colors flex items-center gap-2"
              >
                <ArrowRightLeft size={16} />
                <span className="hidden sm:inline">Karşı Teklif</span>
              </button>
              <button className="h-10 px-6 bg-accent text-white text-body-md font-semibold rounded-lg hover:bg-accent-600 active:scale-[0.97] transition-all shadow-sm flex items-center gap-2">
                <CheckCircle size={16} />
                Kabul Et
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Counter offer form */}
      {selectedOffer && (
        <CounterOfferForm
          open={showCounterForm}
          onClose={() => setShowCounterForm(false)}
          originalPrice={selectedOffer.price}
          originalDeliveryDays={selectedOffer.deliveryDays}
          sellerName={selectedOffer.sellerName}
        />
      )}
    </div>
  );
}
