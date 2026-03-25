'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, ChevronRight, Star, CheckCircle, MapPin, Calendar,
  Banknote, Clock, ArrowRightLeft, Send, Undo2, Shield,
  FileText, Sparkles,
} from 'lucide-react';
import { mockOffers, mockListings } from '@/lib/mock-data';
import { OfferStatusBadge } from '@/components/offers/offer-status-badge';
import { CounterOfferForm } from '@/components/offers/counter-offer-form';
import { RejectReasonModal } from '@/components/offers/reject-reason-modal';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function OfferDetailPage() {
  const params = useParams();
  const offer = mockOffers.find((o) => o.id === params.offerId) || mockOffers[0];
  const listing = mockListings.find((l) => l.id === offer.listingId);
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const badgeLabel: Record<string, string> = { pro: 'Pro Satıcı', plus: 'Plus Satıcı', basic: 'Basic' };
  const badgeColor: Record<string, string> = {
    pro: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    plus: 'bg-neutral-100 text-neutral-600 border-neutral-300 dark:bg-neutral-500/10 dark:text-neutral-400 dark:border-neutral-500/20',
    basic: 'bg-neutral-50 text-neutral-500 border-neutral-200 dark:bg-neutral-500/10 dark:text-neutral-400 dark:border-neutral-500/20',
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-body-sm text-neutral-400 mb-6">
        <Link href="/offers" className="flex items-center gap-1 hover:text-neutral-600 transition-colors">
          <ArrowLeft size={14} /> Tekliflerim
        </Link>
        <ChevronRight size={14} />
        <span className="text-neutral-700 dark:text-dark-textPrimary truncate max-w-[300px]">{offer.listingTitle}</span>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left column — 3/5 */}
        <div className="lg:col-span-3 space-y-6">
          {/* Listing summary card */}
          {listing && (
            <Link
              href={`/listing/${listing.id}`}
              className="block bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border/80 p-5 hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-500 transition-all"
            >
              <p className="text-body-sm text-neutral-400 mb-1">İlan</p>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-primary-lighter dark:bg-primary/20 text-primary dark:text-blue-300 text-body-sm font-medium rounded-sm">
                  {listing.category}
                </span>
                <span className="text-body-sm text-neutral-400 flex items-center gap-1">
                  <MapPin size={12} /> {listing.city}
                </span>
              </div>
              <h2 className="text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary mb-2">
                {listing.title}
              </h2>
              <div className="flex items-center gap-4 text-body-sm text-neutral-500">
                <span className="flex items-center gap-1">
                  <Banknote size={14} className="text-accent" />
                  {formatCurrency(listing.budgetMin)} — {formatCurrency(listing.budgetMax)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={14} /> {listing.deliveryUrgency}
                </span>
              </div>
            </Link>
          )}

          {/* Offer details card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border/80 p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-h3 font-semibold text-neutral-900 dark:text-dark-textPrimary">
                Teklif Detayı
              </h3>
              <OfferStatusBadge status={offer.status} />
            </div>

            {/* Price and delivery */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-accent-lighter/50 dark:bg-accent/10 rounded-lg">
                <p className="text-body-sm text-neutral-500 mb-1">Teklif Fiyatı</p>
                <p className="text-h2 font-bold text-accent">{formatCurrency(offer.price)}</p>
              </div>
              <div className="p-4 bg-neutral-50 dark:bg-dark-surfaceRaised rounded-lg">
                <p className="text-body-sm text-neutral-500 mb-1">Teslimat Süresi</p>
                <p className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary">{offer.deliveryDays} gün</p>
              </div>
            </div>

            {/* Note */}
            <div className="mb-6">
              <h4 className="text-body-md font-semibold text-neutral-700 dark:text-dark-textPrimary mb-2">Satıcı Notu</h4>
              <p className="text-body-lg text-neutral-600 dark:text-dark-textSecondary leading-relaxed">
                {offer.note}
              </p>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-body-sm text-neutral-400 pt-4 border-t border-neutral-100 dark:border-dark-border">
              <span className="flex items-center gap-1">
                <Clock size={13} /> Gönderilme: {formatDate(offer.createdAt)}
              </span>
              {offer.isBoosted && (
                <span className="flex items-center gap-1 text-accent font-medium">
                  <Sparkles size={13} /> Öne Çıkarılmış
                </span>
              )}
              {offer.revisionCount > 0 && (
                <span>{offer.revisionCount} kez revize edildi</span>
              )}
            </div>
          </motion.div>

          {/* Timeline: Counter offer chain */}
          {offer.status === 'counter_offered' && offer.counterOffer && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border/80 p-6"
            >
              <h3 className="text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary mb-5 flex items-center gap-2">
                <ArrowRightLeft size={18} className="text-blue-500" />
                Teklif Geçmişi
              </h3>

              <div className="relative pl-6 space-y-6">
                {/* Timeline line */}
                <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-neutral-200 dark:bg-dark-border" />

                {/* Original offer */}
                <div className="relative">
                  <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-accent border-2 border-white dark:border-dark-surface" />
                  <div className="p-4 bg-accent-lighter/30 dark:bg-accent/5 rounded-lg border border-accent/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Send size={14} className="text-accent" />
                      <p className="text-body-sm font-semibold text-accent">Orijinal Teklif</p>
                      <span className="text-body-sm text-neutral-400 ml-auto">{formatDate(offer.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-body-lg font-bold text-neutral-900 dark:text-dark-textPrimary">{formatCurrency(offer.price)}</p>
                      <p className="text-body-md text-neutral-500">{offer.deliveryDays} gün teslimat</p>
                    </div>
                  </div>
                </div>

                {/* Counter offer */}
                <div className="relative">
                  <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-white dark:border-dark-surface" />
                  <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-100 dark:border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowRightLeft size={14} className="text-blue-600 dark:text-blue-400" />
                      <p className="text-body-sm font-semibold text-blue-600 dark:text-blue-400">Alıcıdan Karşı Teklif</p>
                      <span className="text-body-sm text-neutral-400 ml-auto">{formatDate(offer.counterOffer.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                      <p className="text-body-lg font-bold text-blue-700 dark:text-blue-300">{formatCurrency(offer.counterOffer.price)}</p>
                      {offer.counterOffer.deliveryDays && (
                        <p className="text-body-md text-blue-600/80 dark:text-blue-400/80">{offer.counterOffer.deliveryDays} gün teslimat</p>
                      )}
                    </div>
                    {offer.counterOffer.note && (
                      <p className="text-body-md text-blue-600/80 dark:text-blue-400/80">{offer.counterOffer.note}</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Rejected reason */}
          {offer.status === 'rejected' && offer.rejectedReason && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="p-5 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-100 dark:border-red-500/20"
            >
              <h4 className="text-body-md font-semibold text-red-700 dark:text-red-400 mb-1">Red Sebebi</h4>
              <p className="text-body-lg text-red-600 dark:text-red-300">{offer.rejectedReason}</p>
            </motion.div>
          )}
        </div>

        {/* Right column — 2/5 sticky sidebar */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 space-y-5">
            {/* Seller profile card */}
            <div className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border/80 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-body-lg">
                  {offer.sellerInitials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-body-lg font-semibold text-neutral-900 dark:text-dark-textPrimary">
                      {offer.sellerName}
                    </h4>
                    {offer.sellerVerified && <CheckCircle size={16} className="text-success" />}
                  </div>
                  {offer.sellerBadge && (
                    <span className={`inline-flex px-2 py-0.5 text-[11px] font-bold rounded border mt-1 ${badgeColor[offer.sellerBadge]}`}>
                      {badgeLabel[offer.sellerBadge]}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 text-body-md">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Puan</span>
                  <span className="flex items-center gap-1 font-semibold text-neutral-900 dark:text-dark-textPrimary">
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                    {offer.sellerScore}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Tamamlanan İş</span>
                  <span className="font-semibold text-neutral-900 dark:text-dark-textPrimary">{offer.sellerCompletedDeals}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Üyelik</span>
                  <span className="font-semibold text-neutral-900 dark:text-dark-textPrimary">
                    {new Date(offer.sellerMemberSince).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
                {offer.sellerVerified && (
                  <div className="flex items-center gap-2 text-success text-body-sm font-medium pt-2 border-t border-neutral-100 dark:border-dark-border">
                    <Shield size={14} /> Doğrulanmış Satıcı
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons — context-dependent */}
            <div className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border/80 p-5 space-y-3">
              {(offer.status === 'pending' || offer.status === 'counter_offered') && (
                <>
                  <button className="w-full h-12 bg-accent text-white text-body-lg font-semibold rounded-lg hover:bg-accent-600 active:scale-[0.98] transition-all duration-fast shadow-sm flex items-center justify-center gap-2">
                    <CheckCircle size={18} />
                    Teklifi Kabul Et
                  </button>
                  <button
                    onClick={() => setShowCounterForm(true)}
                    className="w-full h-11 border border-accent text-accent text-body-md font-semibold rounded-lg hover:bg-accent-lighter/50 dark:hover:bg-accent/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowRightLeft size={16} />
                    Karşı Teklif Gönder
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="w-full h-11 border border-neutral-200 dark:border-dark-border text-body-md font-medium text-neutral-500 rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised hover:text-error hover:border-error/30 transition-colors flex items-center justify-center gap-2"
                  >
                    Reddet
                  </button>
                </>
              )}
              {offer.status === 'accepted' && (
                <div className="text-center py-4">
                  <CheckCircle size={32} className="mx-auto mb-2 text-success" />
                  <p className="text-body-lg font-semibold text-success">Teklif Kabul Edildi</p>
                  <p className="text-body-sm text-neutral-500 mt-1">Satıcı ile iletişime geçebilirsiniz.</p>
                </div>
              )}
              {offer.status === 'rejected' && (
                <div className="text-center py-4">
                  <p className="text-body-lg font-semibold text-neutral-500">Bu teklif reddedildi</p>
                </div>
              )}
              {offer.status === 'withdrawn' && (
                <div className="text-center py-4">
                  <Undo2 size={24} className="mx-auto mb-2 text-neutral-400" />
                  <p className="text-body-lg font-semibold text-neutral-500">Satıcı teklifi geri çekti</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Counter offer form slide-over */}
      <CounterOfferForm
        open={showCounterForm}
        onClose={() => setShowCounterForm(false)}
        originalPrice={offer.price}
        originalDeliveryDays={offer.deliveryDays}
        sellerName={offer.sellerName}
      />

      {/* Reject reason modal */}
      <RejectReasonModal
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={(reason) => console.log('Rejected:', reason)}
        sellerName={offer.sellerName}
      />
    </div>
  );
}
