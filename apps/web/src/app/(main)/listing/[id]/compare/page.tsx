'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, ChevronRight, Star, CheckCircle, Sparkles,
  ArrowRightLeft, ChevronDown, Shield, Trophy, Loader2,
} from 'lucide-react';
import { OfferStatusBadge } from '@/components/offers/offer-status-badge';
import { CounterOfferForm } from '@/components/offers/counter-offer-form';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

interface OfferData {
  id: string;
  price: number;
  deliveryDays: number;
  note: string | null;
  status: string;
  isBoosted: boolean;
  seller: {
    id: string;
    name: string;
    score: number;
    verified: boolean;
    badge: string | null;
    completedDeals: number;
    companyName: string | null;
  };
}

interface ListingData {
  id: string;
  title: string;
  budgetMin: number;
  budgetMax: number;
  offers: OfferData[];
}

const sortOptions = [
  { value: 'price-low', label: 'Fiyata Göre (Artan)' },
  { value: 'price-high', label: 'Fiyata Göre (Azalan)' },
  { value: 'delivery', label: 'Teslimat Süresine Göre' },
  { value: 'score', label: 'Puana Göre' },
];

export default function CompareOffersPage() {
  const params = useParams();
  const router = useRouter();
  const [listing, setListing] = useState<ListingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('price-low');
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/listings/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then((data) => setListing(data))
      .catch(() => setListing(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  const offers = useMemo(() => {
    if (!listing) return [];
    const active = listing.offers.filter((o) => o.status !== 'withdrawn' && o.status !== 'rejected');
    switch (sortBy) {
      case 'price-high':
        return [...active].sort((a, b) => b.price - a.price);
      case 'delivery':
        return [...active].sort((a, b) => a.deliveryDays - b.deliveryDays);
      case 'score':
        return [...active].sort((a, b) => (b.seller?.score ?? 0) - (a.seller?.score ?? 0));
      default:
        return [...active].sort((a, b) => a.price - b.price);
    }
  }, [listing, sortBy]);

  const bestPrice = offers.length > 0 ? Math.min(...offers.map((o) => o.price)) : 0;
  const bestDelivery = offers.length > 0 ? Math.min(...offers.map((o) => o.deliveryDays)) : 0;
  const bestScore = offers.length > 0 ? Math.max(...offers.map((o) => o.seller?.score ?? 0)) : 0;

  const selectedOffer = offers.find((o) => o.id === selectedOfferId);

  const handleAccept = async () => {
    if (!selectedOfferId) return;
    setActionLoading(true);
    const res = await fetch(`/api/offers/${selectedOfferId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'accept' }),
    });
    setActionLoading(false);
    if (res.ok) {
      router.push(`/offers/${selectedOfferId}`);
    }
  };

  const handleCounterSubmit = async (data: { price: string; deliveryDays: string; note: string }) => {
    if (!selectedOfferId) return;
    const res = await fetch(`/api/offers/${selectedOfferId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'counter',
        counterPrice: parseFloat(data.price),
        counterDays: data.deliveryDays ? parseInt(data.deliveryDays) : undefined,
        counterNote: data.note || undefined,
      }),
    });
    if (res.ok) {
      setShowCounterForm(false);
      // Refresh listing data
      const refreshed = await fetch(`/api/listings/${params.id}`).then((r) => r.json());
      setListing(refreshed);
    }
  };

  const badgeLabel: Record<string, string> = { pro: 'Pro', plus: 'Plus', basic: 'Basic' };
  const badgeColor: Record<string, string> = {
    pro: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    plus: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-500/10 dark:text-neutral-400',
    basic: 'bg-neutral-50 text-neutral-500 dark:bg-neutral-500/10 dark:text-neutral-400',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary mb-2">İlan Bulunamadı</h2>
        <Link href="/explore" className="text-accent font-semibold hover:text-accent-600">İlanlara Dön</Link>
      </div>
    );
  }

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
          const isBestScore = (offer.seller?.score ?? 0) === bestScore;

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
              {offer.isBoosted && (
                <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-accent text-white text-[11px] font-bold rounded-sm flex items-center gap-1">
                  <Sparkles size={10} /> Öne Çıkan
                </span>
              )}

              <div className="flex items-start gap-3 mb-4">
                <div className={`shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center transition-colors ${
                  isSelected ? 'border-accent bg-accent' : 'border-neutral-300 dark:border-dark-border'
                }`}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary truncate">
                      {offer.seller?.companyName || offer.seller?.name || 'Satıcı'}
                    </h4>
                    {offer.seller?.verified && <CheckCircle size={14} className="text-success shrink-0" />}
                  </div>
                  {offer.seller?.badge && (
                    <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-bold rounded mt-1 ${badgeColor[offer.seller.badge]}`}>
                      {badgeLabel[offer.seller.badge]}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-body-sm text-neutral-500">Fiyat</span>
                  <span className={`text-body-lg font-bold ${isBestPrice ? 'text-success' : 'text-neutral-900 dark:text-dark-textPrimary'}`}>
                    {formatCurrency(offer.price)}
                    {isBestPrice && <Trophy size={12} className="inline ml-1 text-success" />}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-body-sm text-neutral-500">Teslimat</span>
                  <span className={`text-body-md font-semibold ${isBestDelivery ? 'text-success' : 'text-neutral-900 dark:text-dark-textPrimary'}`}>
                    {offer.deliveryDays} gün
                    {isBestDelivery && <Trophy size={12} className="inline ml-1 text-success" />}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-body-sm text-neutral-500">Puan</span>
                  <span className={`flex items-center gap-1 text-body-md font-semibold ${isBestScore ? 'text-success' : 'text-neutral-900 dark:text-dark-textPrimary'}`}>
                    <Star size={13} className="text-amber-400 fill-amber-400" />
                    {offer.seller?.score ?? 0}
                    {isBestScore && <Trophy size={12} className="text-success" />}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-body-sm text-neutral-500">Tamamlanan İş</span>
                  <span className="text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary">{offer.seller?.completedDeals ?? 0}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-body-sm text-neutral-500">Doğrulanma</span>
                  {offer.seller?.verified ? (
                    <span className="flex items-center gap-1 text-body-sm font-medium text-success">
                      <Shield size={12} /> Doğrulanmış
                    </span>
                  ) : (
                    <span className="text-body-sm text-neutral-400">—</span>
                  )}
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-dark-border">
                  <OfferStatusBadge status={offer.status} />
                </div>
              </div>

              {offer.note && (
                <p className="mt-3 text-body-sm text-neutral-400 line-clamp-2">{offer.note}</p>
              )}
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
                {getInitials(selectedOffer.seller?.name || 'S')}
              </div>
              <div className="min-w-0">
                <p className="text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary truncate">{selectedOffer.seller?.companyName || selectedOffer.seller?.name}</p>
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
              <button
                onClick={handleAccept}
                disabled={actionLoading}
                className="h-10 px-6 bg-accent text-white text-body-md font-semibold rounded-lg hover:bg-accent-600 active:scale-[0.97] transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
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
          sellerName={selectedOffer.seller?.companyName || selectedOffer.seller?.name || 'Satıcı'}
          onSubmit={handleCounterSubmit}
        />
      )}
    </div>
  );
}
