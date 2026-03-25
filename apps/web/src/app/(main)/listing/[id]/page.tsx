'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, MapPin, Clock, Eye, MessageSquare, Star,
  Shield, CheckCircle, ChevronRight, Heart, Share2,
  Sparkles, Send, X, FileText, Calendar, Banknote,
  Award, TrendingUp, Info,
} from 'lucide-react';
import { mockListings, mockOffers, type MockOffer } from '@/lib/mock-data';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);
}

function OfferCard({ offer, rank }: { offer: MockOffer; rank: number }) {
  const badgeLabel = { pro: 'Pro Satıcı', plus: 'Plus Satıcı', basic: 'Basic', null: null };
  const badgeColor = { pro: 'bg-amber-50 text-amber-700 border-amber-200', plus: 'bg-neutral-100 text-neutral-600 border-neutral-300', basic: 'bg-neutral-50 text-neutral-500 border-neutral-200', null: '' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: rank * 0.06 }}
      className={`relative rounded-xl border p-5 transition-all duration-normal hover:shadow-md hover:scale-[1.005] ${
        offer.isBoosted
          ? 'border-accent/30 bg-accent-lighter/30 dark:bg-accent/10 dark:border-accent/20'
          : 'border-neutral-200/50 dark:border-dark-border/80 bg-white dark:bg-dark-surface'
      }`}
    >
      {offer.isBoosted && (
        <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-accent text-white text-[11px] font-bold rounded-sm flex items-center gap-1">
          <Sparkles size={10} /> Öne Çıkan
        </span>
      )}

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="shrink-0 w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-body-sm">
          {offer.sellerInitials}
        </div>

        <div className="flex-1 min-w-0">
          {/* Seller info */}
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary">
              {offer.sellerName}
            </h4>
            {offer.sellerVerified && (
              <CheckCircle size={14} className="text-success shrink-0" />
            )}
            {offer.sellerBadge && (
              <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded border ${badgeColor[offer.sellerBadge]}`}>
                {badgeLabel[offer.sellerBadge]}
              </span>
            )}
          </div>

          {/* Seller meta */}
          <div className="flex items-center gap-3 mt-1 text-body-sm text-neutral-400">
            <span className="flex items-center gap-1">
              <Star size={12} className="text-amber-400 fill-amber-400" />
              {offer.sellerScore}
            </span>
            <span>{offer.sellerCompletedDeals} iş tamamladı</span>
          </div>

          {/* Note */}
          <p className="mt-3 text-body-md text-neutral-600 dark:text-dark-textSecondary line-clamp-2">
            {offer.note}
          </p>
        </div>
      </div>

      {/* Price & Delivery */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-neutral-100 dark:border-dark-border">
        <div className="flex-1">
          <p className="text-body-sm text-neutral-400">Teklif Fiyatı</p>
          <p className="text-h3 font-bold text-accent">{formatCurrency(offer.price)}</p>
        </div>
        <div>
          <p className="text-body-sm text-neutral-400">Teslimat</p>
          <p className="text-body-lg font-semibold text-neutral-900 dark:text-dark-textPrimary">
            {offer.deliveryDays} gün
          </p>
        </div>
        <button className="h-10 px-5 bg-accent text-white text-body-md font-semibold rounded-lg hover:bg-accent-600 active:scale-[0.97] transition-all duration-fast">
          Kabul Et
        </button>
      </div>
    </motion.div>
  );
}

export default function ListingDetailPage() {
  const params = useParams();
  const listing = mockListings.find((l) => l.id === params.id) || mockListings[0];
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const listingOffers = mockOffers.filter((o) => o.listingId === listing.id);
  const daysLeft = Math.max(0, Math.floor((new Date(listing.expiresAt).getTime() - Date.now()) / 86400000));

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-body-sm text-neutral-400 mb-6">
        <Link href="/explore" className="flex items-center gap-1 hover:text-neutral-600 transition-colors">
          <ArrowLeft size={14} /> İlanlar
        </Link>
        <ChevronRight size={14} />
        <span className="text-neutral-500">{listing.category}</span>
        <ChevronRight size={14} />
        <span className="text-neutral-700 dark:text-dark-textPrimary truncate max-w-[200px]">{listing.title}</span>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left — Listing Details (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header card */}
          <div className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2.5 py-1 bg-success-light text-success text-body-sm font-medium rounded-sm">
                Aktif
              </span>
              <span className="px-2.5 py-1 bg-primary-lighter text-primary text-body-sm font-medium rounded-sm">
                {listing.category}
              </span>
            </div>

            <h1 className="text-h2 md:text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary mb-4">
              {listing.title}
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 text-body-md text-neutral-500 mb-6">
              <span className="flex items-center gap-1.5">
                <MapPin size={16} /> {listing.city}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={16} /> {listing.deliveryUrgency}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye size={16} /> {listing.viewCount} görüntülenme
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={16} /> {daysLeft} gün kaldı
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`h-10 px-4 rounded-lg border text-body-md font-medium flex items-center gap-2 transition-all ${
                  isFavorite
                    ? 'border-error/30 bg-error-light text-error'
                    : 'border-neutral-200 dark:border-dark-border text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <Heart size={16} className={isFavorite ? 'fill-error' : ''} />
                {isFavorite ? 'Favorilerde' : 'Favorile'}
              </button>
              <button className="h-10 px-4 rounded-lg border border-neutral-200 dark:border-dark-border text-body-md font-medium text-neutral-600 hover:bg-neutral-50 flex items-center gap-2 transition-colors">
                <Share2 size={16} /> Paylaş
              </button>
            </div>

            {/* Budget */}
            <div className="flex items-center gap-4 p-4 bg-accent-lighter/50 dark:bg-accent/10 rounded-lg mb-6">
              <Banknote size={24} className="text-accent shrink-0" />
              <div>
                <p className="text-body-sm text-neutral-500">Bütçe Aralığı</p>
                <p className="text-h3 font-bold text-accent">
                  {formatCurrency(listing.budgetMin)} — {formatCurrency(listing.budgetMax)}
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary mb-3">
                Detaylı Açıklama
              </h3>
              <p className="text-body-lg text-neutral-600 dark:text-dark-textSecondary leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </div>

            {/* Buyer info */}
            <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-dark-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-body-md">
                  {listing.buyerInitials}
                </div>
                <div>
                  <p className="text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary">
                    {listing.buyerName}
                  </p>
                  <div className="flex items-center gap-2 text-body-sm text-neutral-400">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    {listing.buyerScore} puan
                    <span>&middot;</span>
                    <span>Doğrulanmış Alıcı</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info box */}
          <div className="flex items-start gap-3 p-4 bg-primary-50 dark:bg-primary/10 rounded-lg border border-primary/10">
            <Info size={18} className="text-primary shrink-0 mt-0.5" />
            <div className="text-body-md text-primary-700 dark:text-blue-300">
              <p>Bu kategoride ortalama <strong>14 teklif</strong> geliyor.</p>
              <p>En hızlı teklifler ortalama <strong>2 saat</strong> içinde yanıtlanıyor.</p>
            </div>
          </div>
        </div>

        {/* Right — Offers (2 cols) */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 space-y-4">
            {/* Offer header */}
            <div className="flex items-center justify-between">
              <h2 className="text-h3 font-semibold text-neutral-900 dark:text-dark-textPrimary flex items-center gap-2">
                <MessageSquare size={20} className="text-accent" />
                {listingOffers.length} Teklif
              </h2>
              <Link
                href={`/listing/${listing.id}/compare`}
                className="text-body-sm font-semibold text-accent hover:text-accent-600 transition-colors"
              >
                Karşılaştır
              </Link>
            </div>

            {/* Offer CTA */}
            <button
              onClick={() => setShowOfferForm(true)}
              className="w-full h-12 bg-accent text-white text-body-lg font-semibold rounded-xl hover:bg-accent-600 active:scale-[0.98] transition-all duration-fast shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
              <Send size={18} />
              Teklif Ver
            </button>

            {/* Offers list */}
            <div className="space-y-3">
              {listingOffers.map((offer, i) => (
                <OfferCard key={offer.id} offer={offer} rank={i} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Offer Form Slide-Over */}
      <AnimatePresence>
        {showOfferForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setShowOfferForm(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-dark-surface border-l border-neutral-200 dark:border-dark-border shadow-xl z-50 overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-h3 font-semibold text-neutral-900 dark:text-dark-textPrimary">
                    Teklif Ver
                  </h3>
                  <button
                    onClick={() => setShowOfferForm(false)}
                    className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-surfaceRaised transition-colors"
                  >
                    <X size={20} className="text-neutral-500" />
                  </button>
                </div>

                {/* Listing summary */}
                <div className="p-4 bg-neutral-50 dark:bg-dark-surfaceRaised rounded-lg mb-6">
                  <p className="text-body-sm text-neutral-400 mb-1">İlan</p>
                  <p className="text-body-md font-medium text-neutral-900 dark:text-dark-textPrimary line-clamp-2">
                    {listing.title}
                  </p>
                  <p className="text-body-sm text-accent font-semibold mt-1">
                    Bütçe: {formatCurrency(listing.budgetMin)} — {formatCurrency(listing.budgetMax)}
                  </p>
                </div>

                {/* Form */}
                <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                  <div className="space-y-1.5">
                    <label className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">
                      Teklif Fiyatı (₺)
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: 300.000"
                      className="w-full h-11 px-4 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">
                      Teslimat Süresi (Gün)
                    </label>
                    <select className="w-full h-11 px-4 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none">
                      <option>1-3 gün (Acil)</option>
                      <option>7 gün</option>
                      <option selected>14 gün</option>
                      <option>21 gün</option>
                      <option>30 gün</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">
                      Not (Opsiyonel)
                    </label>
                    <textarea
                      rows={3}
                      maxLength={500}
                      placeholder="Teklifinizle ilgili kısa bir not ekleyin..."
                      className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-colors"
                    />
                    <p className="text-body-sm text-neutral-400 text-right">0/500</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">
                      Ek Dosya (Opsiyonel)
                    </label>
                    <div className="border-2 border-dashed border-neutral-200 dark:border-dark-border rounded-lg p-6 text-center hover:border-neutral-300 transition-colors cursor-pointer">
                      <FileText size={24} className="mx-auto mb-2 text-neutral-400" />
                      <p className="text-body-sm text-neutral-500">
                        PDF, görsel veya doküman sürükleyin
                      </p>
                    </div>
                  </div>

                  {/* Remaining quota */}
                  <div className="flex items-center gap-2 p-3 bg-warning-light dark:bg-warning/10 rounded-lg text-body-sm">
                    <Award size={16} className="text-warning shrink-0" />
                    <span className="text-warning-dark dark:text-amber-300">
                      Bu ay <strong>15 teklif hakkınız</strong> kaldı (Plus Paket)
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-12 bg-accent text-white text-body-lg font-semibold rounded-lg hover:bg-accent-600 active:scale-[0.98] transition-all duration-fast shadow-sm flex items-center justify-center gap-2"
                  >
                    <Send size={18} />
                    Teklifi Gönder
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
