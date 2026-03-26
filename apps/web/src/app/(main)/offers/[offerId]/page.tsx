'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, ChevronRight, Star, CheckCircle, MapPin, Calendar,
  Banknote, Clock, ArrowRightLeft, Send, Undo2, Shield,
  Sparkles, Loader2, FileText, Edit3, XCircle, ExternalLink, MessageSquare,
} from 'lucide-react';
import { OfferStatusBadge } from '@/components/offers/offer-status-badge';
import { CounterOfferForm } from '@/components/offers/counter-offer-form';
import { RejectReasonModal } from '@/components/offers/reject-reason-modal';

/* ---------- helpers ---------- */
function formatCurrency(n: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ---------- types ---------- */
interface OfferSeller {
  id: string;
  name: string | null;
  score: number;
  verified: boolean;
  badge: string | null;
  completedDeals: number;
  companyName: string | null;
  createdAt: string;
  city: string | null;
}

interface OfferListing {
  id: string;
  title: string;
  category: string;
  city: string;
  budgetMin: number;
  budgetMax: number;
  buyerId: string;
  deliveryUrgency: string;
}

interface OfferReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: { id: string; name: string };
}

interface Offer {
  id: string;
  price: number;
  deliveryDays: number;
  note: string | null;
  status: string;
  isBoosted: boolean;
  rejectedReason: string | null;
  revisionCount: number;
  counterPrice: number | null;
  counterDays: number | null;
  counterNote: string | null;
  counterAt: string | null;
  completedAt: string | null;
  buyerConfirmed: boolean;
  sellerConfirmed: boolean;
  createdAt: string;
  listing: OfferListing;
  seller: OfferSeller;
  reviews: OfferReview[];
}

/* ---------- component ---------- */
export default function OfferDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const offerId = params.offerId as string;

  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [showCounterForm, setShowCounterForm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');

  const [actionLoading, setActionLoading] = useState(false);

  // Edit form state
  const [editPrice, setEditPrice] = useState('');
  const [editDays, setEditDays] = useState('');
  const [editNote, setEditNote] = useState('');

  const fetchOffer = useCallback(async () => {
    try {
      const res = await fetch(`/api/offers/${offerId}`);
      if (res.status === 404) { setNotFound(true); return; }
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      setOffer(data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [offerId]);

  useEffect(() => { fetchOffer(); }, [fetchOffer]);

  // Populate edit form when offer loads or edit form opens
  useEffect(() => {
    if (offer && showEditForm) {
      setEditPrice(String(offer.price));
      setEditDays(String(offer.deliveryDays));
      setEditNote(offer.note || '');
    }
  }, [offer, showEditForm]);

  /* ---------- role checks ---------- */
  const currentUserId = session?.user?.id;
  const isBuyer = offer ? offer.listing.buyerId === currentUserId : false;
  const isSeller = offer ? offer.seller.id === currentUserId : false;

  /* ---------- actions ---------- */
  async function patchOffer(body: Record<string, unknown>) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Bir hata oluştu');
        return;
      }
      await fetchOffer();
    } finally {
      setActionLoading(false);
    }
  }

  function handleAccept() {
    patchOffer({ action: 'accept' });
  }

  function handleReject(reason: string) {
    patchOffer({ action: 'reject', rejectedReason: reason });
  }

  function handleCounter(data: { price: string; deliveryDays: string; note: string }) {
    patchOffer({ action: 'counter', counterPrice: data.price, counterDays: data.deliveryDays, counterNote: data.note }).then(() => {
      setShowCounterForm(false);
    });
  }

  function handleWithdraw() {
    if (!confirm('Teklifinizi geri çekmek istediğinize emin misiniz?')) return;
    patchOffer({ action: 'withdraw' });
  }

  async function handleStartConversation() {
    if (!offer) return;
    setActionLoading(true);
    try {
      const otherUserId = isBuyer ? offer.seller.id : offer.listing.buyerId;
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: otherUserId,
          listingId: offer.listing.id,
          listingTitle: offer.listing.title,
          message: `Merhaba! "${offer.listing.title}" ilanı için kabul edilen teklif hakkında mesajlaşmak istiyorum.`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/messages?conversation=${data.id}`);
      }
    } finally {
      setActionLoading(false);
    }
  }

  function handleConfirm() {
    patchOffer({ action: 'confirm' });
  }

  async function handleReview(e: React.FormEvent) {
    e.preventDefault();
    if (!offer || reviewRating < 1) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId: offer.id,
          rating: reviewRating,
          comment: reviewComment.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Değerlendirme gönderilemedi');
        return;
      }
      setShowReviewForm(false);
      await fetchOffer(); // Refresh to show the review
    } finally {
      setActionLoading(false);
    }
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    patchOffer({ action: 'edit', price: editPrice, deliveryDays: editDays, note: editNote }).then(() => {
      setShowEditForm(false);
    });
  }

  /* ---------- badge maps ---------- */
  const badgeLabel: Record<string, string> = { pro: 'Pro Satıcı', plus: 'Plus Satıcı', basic: 'Basic' };
  const badgeColor: Record<string, string> = {
    pro: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    plus: 'bg-neutral-100 text-neutral-600 border-neutral-300 dark:bg-neutral-500/10 dark:text-neutral-400 dark:border-neutral-500/20',
    basic: 'bg-neutral-50 text-neutral-500 border-neutral-200 dark:bg-neutral-500/10 dark:text-neutral-400 dark:border-neutral-500/20',
  };

  const urgencyLabel: Record<string, string> = {
    urgent: 'Acil',
    one_week: '1 Hafta',
    two_weeks: '2 Hafta',
    one_month: '1 Ay',
    flexible: 'Esnek',
  };

  /* ---------- loading ---------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  /* ---------- 404 ---------- */
  if (notFound || !offer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <FileText size={48} className="text-neutral-300" />
        <h2 className="text-h3 font-semibold text-neutral-700 dark:text-dark-textPrimary">Teklif Bulunamadı</h2>
        <p className="text-body-md text-neutral-500">Bu teklif mevcut değil veya silinmiş olabilir.</p>
        <Link href="/offers" className="text-primary hover:underline text-body-md">
          Tekliflerime Dön
        </Link>
      </div>
    );
  }

  const { listing, seller } = offer;
  const sellerInitials = seller.name ? seller.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) : '??';

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-body-sm text-neutral-400 mb-6">
        <Link href="/offers" className="flex items-center gap-1 hover:text-neutral-600 transition-colors">
          <ArrowLeft size={14} /> Tekliflerim
        </Link>
        <ChevronRight size={14} />
        <span className="text-neutral-700 dark:text-dark-textPrimary truncate max-w-[300px]">{listing.title}</span>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left column — 3/5 */}
        <div className="lg:col-span-3 space-y-6">
          {/* Listing summary card */}
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
                <Calendar size={14} /> {urgencyLabel[listing.deliveryUrgency] || listing.deliveryUrgency}
              </span>
            </div>
          </Link>

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
            {offer.note && (
              <div className="mb-6">
                <h4 className="text-body-md font-semibold text-neutral-700 dark:text-dark-textPrimary mb-2">Satıcı Notu</h4>
                <p className="text-body-lg text-neutral-600 dark:text-dark-textSecondary leading-relaxed">
                  {offer.note}
                </p>
              </div>
            )}

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
          {offer.status === 'counter_offered' && offer.counterPrice && (
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
                      {offer.counterAt && (
                        <span className="text-body-sm text-neutral-400 ml-auto">{formatDate(offer.counterAt)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                      <p className="text-body-lg font-bold text-blue-700 dark:text-blue-300">{formatCurrency(offer.counterPrice)}</p>
                      {offer.counterDays && (
                        <p className="text-body-md text-blue-600/80 dark:text-blue-400/80">{offer.counterDays} gün teslimat</p>
                      )}
                    </div>
                    {offer.counterNote && (
                      <p className="text-body-md text-blue-600/80 dark:text-blue-400/80">{offer.counterNote}</p>
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
                <Link href={`/profile/${seller.id}`} className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-body-lg hover:ring-2 hover:ring-accent/30 transition-all">
                  {sellerInitials}
                </Link>
                <div>
                  <div className="flex items-center gap-2">
                    <Link href={`/profile/${seller.id}`} className="text-body-lg font-semibold text-neutral-900 dark:text-dark-textPrimary hover:text-accent transition-colors">
                      {seller.name || 'Anonim'}
                    </Link>
                    {seller.verified && <CheckCircle size={16} className="text-success" />}
                  </div>
                  {seller.badge && (
                    <span className={`inline-flex px-2 py-0.5 text-[11px] font-bold rounded border mt-1 ${badgeColor[seller.badge] || badgeColor.basic}`}>
                      {badgeLabel[seller.badge] || seller.badge}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 text-body-md">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Puan</span>
                  <span className="flex items-center gap-1 font-semibold text-neutral-900 dark:text-dark-textPrimary">
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                    {seller.score}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Tamamlanan İş</span>
                  <span className="font-semibold text-neutral-900 dark:text-dark-textPrimary">{seller.completedDeals}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Üyelik</span>
                  <span className="font-semibold text-neutral-900 dark:text-dark-textPrimary">
                    {new Date(seller.createdAt).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
                {seller.verified && (
                  <div className="flex items-center gap-2 text-success text-body-sm font-medium pt-2 border-t border-neutral-100 dark:border-dark-border">
                    <Shield size={14} /> Doğrulanmış Satıcı
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons — context-dependent */}
            <div className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border/80 p-5 space-y-3">
              {/* Buyer actions: accept, counter, reject */}
              {isBuyer && (offer.status === 'pending' || offer.status === 'counter_offered') && (
                <>
                  <button
                    onClick={handleAccept}
                    disabled={actionLoading}
                    className="w-full h-12 bg-accent text-white text-body-lg font-semibold rounded-lg hover:bg-accent-600 active:scale-[0.98] transition-all duration-fast shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {actionLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <CheckCircle size={18} />
                    )}
                    Kabul Et
                  </button>
                  <button
                    onClick={() => setShowCounterForm(true)}
                    disabled={actionLoading}
                    className="w-full h-11 border border-accent text-accent text-body-md font-semibold rounded-lg hover:bg-accent-lighter/50 dark:hover:bg-accent/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <ArrowRightLeft size={16} />
                    Karşı Teklif Gönder
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    className="w-full h-11 border border-neutral-200 dark:border-dark-border text-body-md font-medium text-neutral-500 rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised hover:text-error hover:border-error/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    Reddet
                  </button>
                </>
              )}

              {/* Seller actions: edit, withdraw (when pending) */}
              {isSeller && offer.status === 'pending' && (
                <>
                  <button
                    onClick={() => setShowEditForm(true)}
                    disabled={actionLoading}
                    className="w-full h-11 border border-accent text-accent text-body-md font-semibold rounded-lg hover:bg-accent-lighter/50 dark:hover:bg-accent/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Edit3 size={16} />
                    Teklifi Düzenle
                  </button>
                  <button
                    onClick={handleWithdraw}
                    disabled={actionLoading}
                    className="w-full h-11 border border-neutral-200 dark:border-dark-border text-body-md font-medium text-neutral-500 rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised hover:text-error hover:border-error/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle size={16} />
                    Teklifi Geri Çek
                  </button>
                </>
              )}

              {/* Seller: rejected - new offer link */}
              {isSeller && offer.status === 'rejected' && (
                <Link
                  href={`/listing/${listing.id}`}
                  className="w-full h-12 bg-accent text-white text-body-lg font-semibold rounded-lg hover:bg-accent-600 active:scale-[0.98] transition-all duration-fast shadow-sm flex items-center justify-center gap-2"
                >
                  <ExternalLink size={18} />
                  Yeni Teklif Ver
                </Link>
              )}

              {/* Accepted state */}
              {offer.status === 'accepted' && (() => {
                const myConfirmed = isBuyer ? offer.buyerConfirmed : offer.sellerConfirmed;
                const otherConfirmed = isBuyer ? offer.sellerConfirmed : offer.buyerConfirmed;
                return (
                  <>
                    <div className="text-center py-3">
                      <CheckCircle size={32} className="mx-auto mb-2 text-success" />
                      <p className="text-body-lg font-semibold text-success">Teklif Kabul Edildi</p>
                      <p className="text-body-sm text-neutral-500 mt-1">
                        Teslimat tamamlandığında her iki taraf da onaylamalıdır.
                      </p>
                    </div>

                    {/* Confirmation status */}
                    <div className="p-4 bg-neutral-50 dark:bg-dark-surfaceRaised rounded-lg space-y-2.5">
                      <div className="flex items-center gap-2">
                        {offer.buyerConfirmed ? (
                          <CheckCircle size={16} className="text-success" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-neutral-300 dark:border-neutral-600" />
                        )}
                        <span className={`text-body-sm ${offer.buyerConfirmed ? 'text-success font-medium' : 'text-neutral-500'}`}>
                          Alıcı {offer.buyerConfirmed ? 'onayladı' : 'henüz onaylamadı'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {offer.sellerConfirmed ? (
                          <CheckCircle size={16} className="text-success" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-neutral-300 dark:border-neutral-600" />
                        )}
                        <span className={`text-body-sm ${offer.sellerConfirmed ? 'text-success font-medium' : 'text-neutral-500'}`}>
                          Satıcı {offer.sellerConfirmed ? 'onayladı' : 'henüz onaylamadı'}
                        </span>
                      </div>
                    </div>

                    {/* Confirm button */}
                    {!myConfirmed && (
                      <button
                        onClick={handleConfirm}
                        disabled={actionLoading}
                        className="w-full h-12 bg-accent text-white text-body-lg font-semibold rounded-lg hover:bg-accent-600 active:scale-[0.98] transition-all duration-fast shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                        Teslimatı Onayla
                      </button>
                    )}
                    {myConfirmed && !otherConfirmed && (
                      <div className="text-center py-2">
                        <p className="text-body-sm text-success font-medium">Onayınız alındı</p>
                        <p className="text-body-sm text-neutral-400 mt-0.5">Karşı tarafın onayı bekleniyor...</p>
                      </div>
                    )}

                    <button
                      onClick={handleStartConversation}
                      disabled={actionLoading}
                      className="w-full h-11 border border-primary text-primary text-body-md font-semibold rounded-lg hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <MessageSquare size={16} />}
                      Mesajlaşmayı Başlat
                    </button>
                  </>
                );
              })()}

              {/* Completed state */}
              {offer.status === 'completed' && (() => {
                const myReview = offer.reviews.find((r) => r.reviewer.id === currentUserId);
                const otherReviews = offer.reviews.filter((r) => r.reviewer.id !== currentUserId);
                const reviewTarget = isBuyer ? 'Satıcıyı' : 'Alıcıyı';
                return (
                  <>
                    <div className="text-center py-4">
                      <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-success/10 flex items-center justify-center">
                        <CheckCircle size={32} className="text-success" />
                      </div>
                      <p className="text-body-lg font-semibold text-success">Sipariş Tamamlandı</p>
                      {offer.completedAt && (
                        <p className="text-body-sm text-neutral-400 mt-1">{formatDate(offer.completedAt)}</p>
                      )}
                    </div>

                    {/* Existing reviews */}
                    {offer.reviews.length > 0 && (
                      <div className="space-y-3">
                        {offer.reviews.map((rev) => (
                          <div key={rev.id} className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-100 dark:border-amber-500/20">
                            <div className="flex items-center gap-1 mb-2">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  size={16}
                                  className={s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-200 dark:text-neutral-600'}
                                />
                              ))}
                              <span className="text-body-sm font-bold text-amber-700 dark:text-amber-400 ml-1">{rev.rating}/5</span>
                            </div>
                            {rev.comment && (
                              <p className="text-body-md text-neutral-700 dark:text-dark-textSecondary leading-relaxed">
                                &ldquo;{rev.comment}&rdquo;
                              </p>
                            )}
                            <Link href={`/profile/${rev.reviewer.id}`} className="text-body-sm text-neutral-400 mt-2 hover:text-accent transition-colors inline-block">
                              {rev.reviewer.name} tarafından değerlendirildi
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Review button — both buyer and seller can review if they haven't yet */}
                    {!myReview && (
                      <button
                        onClick={() => setShowReviewForm(true)}
                        className="w-full h-12 bg-amber-500 text-white text-body-lg font-semibold rounded-lg hover:bg-amber-600 active:scale-[0.98] transition-all duration-fast shadow-sm flex items-center justify-center gap-2"
                      >
                        <Star size={18} />
                        {reviewTarget} Değerlendir
                      </button>
                    )}

                    <button
                      onClick={handleStartConversation}
                      disabled={actionLoading}
                      className="w-full h-11 border border-primary text-primary text-body-md font-semibold rounded-lg hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <MessageSquare size={16} />
                      Mesajlaşmayı Başlat
                    </button>
                  </>
                );
              })()}

              {/* Rejected state (buyer view) */}
              {isBuyer && offer.status === 'rejected' && (
                <div className="text-center py-4">
                  <p className="text-body-lg font-semibold text-neutral-500">Bu teklif reddedildi</p>
                </div>
              )}

              {/* Withdrawn state */}
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
        sellerName={seller.name || 'Satıcı'}
        onSubmit={handleCounter}
        submitting={actionLoading}
      />

      {/* Reject reason modal */}
      <RejectReasonModal
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleReject}
        sellerName={seller.name || 'Satıcı'}
      />

      {/* Edit offer slide-over (seller) */}
      {/* Review form modal */}
      {showReviewForm && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setShowReviewForm(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-dark-surface rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                    <Star size={32} className="text-amber-400" />
                  </div>
                  <h3 className="text-h3 font-bold text-neutral-900 dark:text-dark-textPrimary">
                    {isBuyer ? 'Satıcıyı' : 'Alıcıyı'} Değerlendir
                  </h3>
                  <p className="text-body-md text-neutral-500 mt-1">
                    Puanınızı verin
                  </p>
                </div>

                <form onSubmit={handleReview} className="space-y-5">
                  {/* Star rating */}
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onMouseEnter={() => setReviewHover(s)}
                        onMouseLeave={() => setReviewHover(0)}
                        onClick={() => setReviewRating(s)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          size={36}
                          className={`transition-colors ${
                            s <= (reviewHover || reviewRating)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-neutral-200 dark:text-neutral-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {reviewRating > 0 && (
                    <p className="text-center text-body-md font-medium text-amber-600 dark:text-amber-400">
                      {['', 'Kötü', 'Fena Değil', 'İyi', 'Çok İyi', 'Mükemmel'][reviewRating]}
                    </p>
                  )}

                  {/* Comment */}
                  <div>
                    <label className="block text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary mb-2">
                      Yorumunuz <span className="text-neutral-400 font-normal">(isteğe bağlı)</span>
                    </label>
                    <textarea
                      rows={3}
                      maxLength={500}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Deneyiminizi paylaşın..."
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400/30 resize-none transition-colors"
                    />
                    <p className="text-body-sm text-neutral-400 text-right mt-1">{reviewComment.length}/500</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="flex-1 h-12 rounded-xl border border-neutral-200 dark:border-dark-border text-body-md font-medium text-neutral-600 dark:text-dark-textSecondary hover:bg-neutral-50 dark:hover:bg-dark-border/50 transition-colors"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      disabled={reviewRating < 1 || actionLoading}
                      className="flex-1 h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-body-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {actionLoading ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Star size={18} />
                      )}
                      Gönder
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {showEditForm && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setShowEditForm(false)}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-dark-surface border-l border-neutral-200 dark:border-dark-border shadow-xl z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-h3 font-semibold text-neutral-900 dark:text-dark-textPrimary flex items-center gap-2">
                  <Edit3 size={20} className="text-accent" />
                  Teklifi Düzenle
                </h3>
                <button onClick={() => setShowEditForm(false)} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-surfaceRaised transition-colors">
                  <XCircle size={20} className="text-neutral-500" />
                </button>
              </div>

              <form className="space-y-5" onSubmit={handleEdit}>
                <div className="space-y-1.5">
                  <label className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">
                    Fiyat (₺)
                  </label>
                  <input
                    type="text"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full h-11 px-4 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">
                    Teslimat Süresi (Gün)
                  </label>
                  <input
                    type="number"
                    value={editDays}
                    onChange={(e) => setEditDays(e.target.value)}
                    className="w-full h-11 px-4 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">
                    Not
                  </label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="Teklifinizle ilgili bir not..."
                    className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-colors"
                  />
                  <p className="text-body-sm text-neutral-400 text-right">{editNote.length}/500</p>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full h-12 bg-accent text-white text-body-lg font-semibold rounded-lg hover:bg-accent-600 active:scale-[0.98] transition-all duration-fast shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {actionLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                  {actionLoading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
