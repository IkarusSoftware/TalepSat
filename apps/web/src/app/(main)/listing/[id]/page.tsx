'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, MapPin, Clock, Eye, MessageSquare, Star,
  CheckCircle, ChevronRight, Heart, Share2, Pencil, Trash2,
  Sparkles, Send, X, FileText, Calendar, Banknote,
  Award, Info, Loader2, AlertTriangle, CheckCheck,
} from 'lucide-react';
import { isRenderableImageUrl } from '../../../../../../../shared/media';

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
  createdAt: string;
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
  description: string;
  category: string;
  categorySlug: string;
  budgetMin: number;
  budgetMax: number;
  city: string;
  deliveryUrgency: string;
  status: string;
  images: string[];
  viewCount: number;
  expiresAt: string;
  createdAt: string;
  buyerId: string;
  buyerName: string;
  buyerInitials: string;
  buyerScore: number;
  buyer: {
    id: string;
    name: string;
    score: number;
    verified: boolean;
    completedDeals: number;
    createdAt: string;
  };
  offers: OfferData[];
  myOffer?: OfferData | null;
  offerCount: number;
}

const deliveryLabels: Record<string, string> = {
  urgent: 'Acil (1-3 gün)',
  week: '1 Hafta',
  two_weeks: '2 Hafta',
  month: '1 Ay',
  flexible: 'Esnek',
};

function OfferCard({ offer, rank, isOwner, onAccept, onReject }: { offer: OfferData; rank: number; isOwner: boolean; onAccept: (id: string) => void; onReject: (id: string) => void }) {
  const badgeLabel: Record<string, string> = { pro: 'Pro Satıcı', plus: 'Plus Satıcı', basic: 'Basic' };
  const badgeColor: Record<string, string> = { pro: 'bg-amber-50 text-amber-700 border-amber-200', plus: 'bg-neutral-100 text-neutral-600 border-neutral-300', basic: 'bg-neutral-50 text-neutral-500 border-neutral-200' };

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
        <Link href={`/profile/${offer.seller?.id}`} className="shrink-0 w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-body-sm hover:ring-2 hover:ring-accent/30 transition-all">
          {getInitials(offer.seller?.name ?? '')}
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/profile/${offer.seller?.id}`} className="text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary hover:text-accent transition-colors">
              {offer.seller?.companyName || offer.seller?.name || 'Satıcı'}
            </Link>
            {offer.seller?.verified && (
              <CheckCircle size={14} className="text-success shrink-0" />
            )}
            {offer.seller?.badge && (
              <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded border ${badgeColor[offer.seller.badge] || ''}`}>
                {badgeLabel[offer.seller.badge] || offer.seller.badge}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1 text-body-sm text-neutral-400">
            <span className="flex items-center gap-1">
              <Star size={12} className="text-amber-400 fill-amber-400" />
              {offer.seller?.score ?? 0}
            </span>
            <span>{offer.seller?.completedDeals ?? 0} iş tamamladı</span>
          </div>

          {offer.note && (
            <p className="mt-3 text-body-md text-neutral-600 dark:text-dark-textSecondary line-clamp-2">
              {offer.note}
            </p>
          )}
        </div>
      </div>

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
        {isOwner && offer.status === 'pending' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onReject(offer.id)}
              className="h-10 px-4 border border-neutral-200 dark:border-dark-border text-body-md font-semibold text-neutral-600 dark:text-dark-textSecondary rounded-lg hover:bg-red-50 hover:border-red-200 hover:text-error dark:hover:bg-red-500/10 active:scale-[0.97] transition-all duration-fast"
            >
              Reddet
            </button>
            <button
              onClick={() => onAccept(offer.id)}
              className="h-10 px-5 bg-accent text-white text-body-md font-semibold rounded-lg hover:bg-accent-600 active:scale-[0.97] transition-all duration-fast"
            >
              Kabul Et
            </button>
          </div>
        )}
        {offer.status === 'accepted' && (
          <span className="px-3 py-1 bg-success-light text-success text-body-sm font-semibold rounded-lg">
            ✓ Kabul Edildi
          </span>
        )}
        {offer.status === 'rejected' && (
          <span className="px-3 py-1 bg-red-50 text-error text-body-sm font-semibold rounded-lg">
            Reddedildi
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [listing, setListing] = useState<ListingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [shared, setShared] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // Offer form state
  const [offerPrice, setOfferPrice] = useState('');
  const [offerDeliveryDays, setOfferDeliveryDays] = useState('14');
  const [offerNote, setOfferNote] = useState('');

  useEffect(() => {
    if (!params.id || !session?.user) return;
    fetch(`/api/listings/${params.id}/favorite-status`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setIsFavorite(data.favorited); })
      .catch(() => {});
  }, [params.id, session?.user]);

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

  const isOwner = session?.user?.id === listing?.buyerId;
  const myOffer = !isOwner ? listing?.myOffer ?? null : null;

  const handleAcceptOffer = async (offerId: string) => {
    const res = await fetch(`/api/offers/${offerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'accept' }),
    });
    if (res.ok) {
      setListing((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          offers: prev.offers.map((o) =>
            o.id === offerId ? { ...o, status: 'accepted' } : o.status === 'pending' ? { ...o, status: 'rejected' } : o
          ),
        };
      });
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    const res = await fetch(`/api/offers/${offerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject' }),
    });
    if (res.ok) {
      setListing((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          offers: prev.offers.map((o) =>
            o.id === offerId ? { ...o, status: 'rejected' } : o
          ),
        };
      });
    }
  };

  const handleDelete = async () => {
    if (!params.id) return;
    setDeleting(true);
    const res = await fetch(`/api/listings/${params.id}`, { method: 'DELETE' });
    setDeleting(false);
    if (res.ok) {
      setShowDeleteConfirm(false);
      setDeleteSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2200);
    }
  };

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerPrice || !listing) return;
    setSubmitting(true);

    const res = await fetch('/api/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listingId: listing.id,
        price: parseFloat(offerPrice.replace(/\./g, '')),
        deliveryDays: parseInt(offerDeliveryDays),
        note: offerNote || null,
      }),
    });

    setSubmitting(false);
    if (res.ok) {
      const newOffer = await res.json();
      setListing((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          offers: isOwner ? [newOffer, ...prev.offers] : prev.offers,
          myOffer: !isOwner ? newOffer : prev.myOffer,
          offerCount: prev.offerCount + 1,
        };
      });
      setShowOfferForm(false);
      setOfferPrice('');
      setOfferNote('');
    } else {
      const err = await res.json();
      alert(err.error || 'Teklif gönderilemedi');
    }
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
        <p className="text-body-lg text-neutral-500 mb-6">Bu ilan silinmiş veya mevcut değil.</p>
        <Link href="/explore" className="h-11 px-6 bg-accent text-white text-body-md font-semibold rounded-lg hover:bg-accent-600 transition-colors inline-flex items-center gap-2">
          <ArrowLeft size={16} /> İlanlara Dön
        </Link>
      </div>
    );
  }

  const daysLeft = Math.max(0, Math.floor((new Date(listing.expiresAt).getTime() - Date.now()) / 86400000));

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">

      {/* ── Animasyonlu başarı toast ─────────────────────────────── */}
      <AnimatePresence>
        {deleteSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 bg-success text-white rounded-xl shadow-lg"
          >
            <CheckCheck size={20} className="shrink-0" />
            <div>
              <p className="text-body-md font-semibold">İlan başarıyla silindi!</p>
              <p className="text-body-sm opacity-80">İlanlarım sayfasına yönlendiriliyorsunuz…</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Silme onay modalı ────────────────────────────────────── */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteConfirm(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              className="bg-white dark:bg-dark-surface rounded-2xl border border-neutral-200/50 dark:border-dark-border p-6 w-full max-w-md shadow-xl"
            >
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
              <h3 className="text-h4 font-bold text-neutral-900 dark:text-dark-textPrimary text-center mb-2">
                İlanı silmek istiyor musunuz?
              </h3>
              <p className="text-body-md text-neutral-500 text-center mb-6">
                <strong className="text-neutral-700 dark:text-dark-textPrimary">&ldquo;{listing.title}&rdquo;</strong> ilanı kalıcı olarak silinecek. Bu işlem geri alınamaz.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 h-11 rounded-xl border border-neutral-200 dark:border-dark-border text-body-md font-medium text-neutral-600 dark:text-dark-textSecondary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors disabled:opacity-50"
                >
                  İptal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white text-body-md font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {deleting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <><Trash2 size={16} /> Evet, Sil</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <span className={`px-2.5 py-1 text-body-sm font-medium rounded-sm ${listing.status === 'active' ? 'bg-success-light text-success' : 'bg-neutral-100 text-neutral-500'}`}>
                {listing.status === 'active' ? 'Aktif' : listing.status === 'closed' ? 'Kapandı' : listing.status}
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
                <Calendar size={16} /> {deliveryLabels[listing.deliveryUrgency] || listing.deliveryUrgency}
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
              {session?.user && (
                <button
                  onClick={async () => {
                    if (!params.id) return;
                    const res = await fetch(`/api/listings/${params.id}/favorite`, { method: 'POST' });
                    if (res.ok) {
                      const data = await res.json();
                      setIsFavorite(data.favorited);
                    }
                  }}
                  className={`h-10 px-4 rounded-lg border text-body-md font-medium flex items-center gap-2 transition-all ${
                    isFavorite
                      ? 'border-error/30 bg-error-light text-error'
                      : 'border-neutral-200 dark:border-dark-border text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <Heart size={16} className={isFavorite ? 'fill-error' : ''} />
                  {isFavorite ? 'Favorilerde' : 'Favorile'}
                </button>
              )}
              <button
                onClick={async () => {
                  const url = window.location.href;
                  const text = `${listing.title} - TalepSat`;
                  if (navigator.share) {
                    try { await navigator.share({ title: text, url }); } catch {}
                  } else {
                    await navigator.clipboard.writeText(url);
                    setShared(true);
                    setTimeout(() => setShared(false), 2000);
                  }
                }}
                className="h-10 px-4 rounded-lg border border-neutral-200 dark:border-dark-border text-body-md font-medium text-neutral-600 hover:bg-neutral-50 flex items-center gap-2 transition-colors"
              >
                <Share2 size={16} /> {shared ? 'Kopyalandı!' : 'Paylaş'}
              </button>
              {isOwner && (
                <>
                  <Link
                    href={`/listing/${listing.id}/edit`}
                    className="h-10 px-4 rounded-lg border border-neutral-200 dark:border-dark-border text-body-md font-medium text-neutral-600 dark:text-dark-textSecondary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised flex items-center gap-2 transition-colors"
                  >
                    <Pencil size={16} /> Düzenle
                  </Link>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="h-10 px-4 rounded-lg border border-red-200 dark:border-red-500/30 text-body-md font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                  >
                    <Trash2 size={16} /> Sil
                  </button>
                </>
              )}
            </div>

            {/* Budget */}
            <div className="flex items-center gap-4 p-4 bg-accent-lighter/50 dark:bg-accent/10 rounded-lg mb-6">
              <Banknote size={24} className="text-accent shrink-0" />
              <div>
                <p className="text-body-sm text-neutral-500">Bütçe Aralığı</p>
                <p className="text-h3 font-bold text-accent">
                  {listing.budgetMin > 0 || listing.budgetMax > 0
                    ? `${formatCurrency(listing.budgetMin)} — ${formatCurrency(listing.budgetMax)}`
                    : 'Teklif bekleniyor'}
                </p>
              </div>
            </div>

            {/* Images */}
            {listing.images && listing.images.length > 0 && (
              <div className="mb-6">
                <h3 className="text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary mb-3">Görseller</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {listing.images.filter((img) => isRenderableImageUrl(img)).map((img, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden border border-neutral-200 dark:border-dark-border">
                      <img src={img} alt={`Görsel ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

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
              <Link href={`/profile/${listing.buyer.id}`} className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-body-md">
                  {listing.buyerInitials}
                </div>
                <div>
                  <p className="text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary group-hover:text-accent transition-colors">
                    {listing.buyerName}
                  </p>
                  <div className="flex items-center gap-2 text-body-sm text-neutral-400">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    {listing.buyerScore} puan
                    <span>&middot;</span>
                    <span>{listing.buyer.verified ? 'Doğrulanmış Alıcı' : 'Alıcı'}</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Info box */}
          <div className="flex items-start gap-3 p-4 bg-primary-50 dark:bg-primary/10 rounded-lg border border-primary/10">
            <Info size={18} className="text-primary shrink-0 mt-0.5" />
            <div className="text-body-md text-primary-700 dark:text-blue-300">
              <p>Bu ilanda <strong>{listing.offerCount} teklif</strong> var.</p>
              <p>İlan süresi dolmadan teklifinizi gönderin.</p>
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
                {listing.offerCount} Teklif
              </h2>
              {listing.offerCount > 1 && (
                <Link
                  href={`/listing/${listing.id}/compare`}
                  className="text-body-sm font-semibold text-accent hover:text-accent-600 transition-colors"
                >
                  Karşılaştır
                </Link>
              )}
            </div>

            {/* Offer CTA — only for non-owners */}
            {!isOwner && listing.status === 'active' && !myOffer && (
              <button
                onClick={() => setShowOfferForm(true)}
                className="w-full h-12 bg-accent text-white text-body-lg font-semibold rounded-xl hover:bg-accent-600 active:scale-[0.98] transition-all duration-fast shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              >
                <Send size={18} />
                Teklif Ver
              </button>
            )}

            {/* Offers list */}
            <div className="space-y-3">
              {isOwner && listing.offers.length > 0 ? (
                listing.offers.map((offer, i) => (
                  <OfferCard key={offer.id} offer={offer} rank={i} isOwner={isOwner} onAccept={handleAcceptOffer} onReject={handleRejectOffer} />
                ))
              ) : !isOwner && myOffer ? (
                <div className="rounded-xl border border-success/20 bg-success-light/40 dark:bg-success/10 dark:border-success/20 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-body-sm text-success font-semibold mb-1">Teklifiniz gonderildi</p>
                      <p className="text-h3 font-bold text-neutral-900 dark:text-dark-textPrimary">
                        {formatCurrency(myOffer.price)}
                      </p>
                      <p className="text-body-md text-neutral-500 dark:text-dark-textSecondary mt-1">
                        {myOffer.deliveryDays} gun teslimat
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-body-sm font-semibold ${
                      myOffer.status === 'accepted'
                        ? 'bg-success-light text-success'
                        : myOffer.status === 'rejected'
                          ? 'bg-red-50 text-error'
                          : 'bg-accent-lighter text-accent'
                    }`}>
                      {myOffer.status === 'pending'
                        ? 'Beklemede'
                        : myOffer.status === 'accepted'
                          ? 'Kabul edildi'
                          : myOffer.status === 'rejected'
                            ? 'Reddedildi'
                            : myOffer.status}
                    </span>
                  </div>
                  {myOffer.note && (
                    <p className="mt-3 text-body-md text-neutral-600 dark:text-dark-textSecondary">
                      {myOffer.note}
                    </p>
                  )}
                  <p className="mt-4 text-body-sm text-neutral-500 dark:text-dark-textSecondary">
                    Bu ilana zaten teklif verdiniz. Durumu guncellenene kadar yeni teklif gonderemezsiniz.
                  </p>
                </div>
              ) : !isOwner && listing.offerCount > 0 ? (
                <div className="text-center py-12 bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border">
                  <MessageSquare size={32} className="mx-auto mb-3 text-neutral-300" />
                  <p className="text-body-md text-neutral-500 dark:text-dark-textSecondary">Bu ilanda teklif var</p>
                  <p className="text-body-sm text-neutral-400 mt-1">
                    Teklif detaylarini yalnizca ilan sahibi gorebilir.
                  </p>
                </div>
              ) : (
                <div className="text-center py-12 bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border">
                  <MessageSquare size={32} className="mx-auto mb-3 text-neutral-300" />
                  <p className="text-body-md text-neutral-400">Henüz teklif yok</p>
                  <p className="text-body-sm text-neutral-300 mt-1">İlk teklifi veren siz olun!</p>
                </div>
              )}
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
                    Bütçe:{' '}
                    {listing.budgetMin === 0 && listing.budgetMax === 0
                      ? 'Teklif Bekliyor'
                      : `${formatCurrency(listing.budgetMin)} — ${formatCurrency(listing.budgetMax)}`}
                  </p>
                </div>

                {/* Form */}
                <form className="space-y-5" onSubmit={handleSubmitOffer}>
                  <div className="space-y-1.5">
                    <label className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">
                      Teklif Fiyatı (₺)
                    </label>
                    <input
                      type="text"
                      value={offerPrice}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '');
                        setOfferPrice(digits ? Number(digits).toLocaleString('tr-TR') : '');
                      }}
                      placeholder="Örn: 300.000"
                      className="w-full h-11 px-4 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">
                      Teslimat Süresi (Gün)
                    </label>
                    <select
                      value={offerDeliveryDays}
                      onChange={(e) => setOfferDeliveryDays(e.target.value)}
                      className="w-full h-11 px-4 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                    >
                      <option value="3">1-3 gün (Acil)</option>
                      <option value="7">7 gün</option>
                      <option value="14">14 gün</option>
                      <option value="21">21 gün</option>
                      <option value="30">30 gün</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">
                      Not (Opsiyonel)
                    </label>
                    <textarea
                      rows={3}
                      maxLength={500}
                      value={offerNote}
                      onChange={(e) => setOfferNote(e.target.value)}
                      placeholder="Teklifinizle ilgili kısa bir not ekleyin..."
                      className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-colors"
                    />
                    <p className="text-body-sm text-neutral-400 text-right">{offerNote.length}/500</p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !offerPrice}
                    className="w-full h-12 bg-accent text-white text-body-lg font-semibold rounded-lg hover:bg-accent-600 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none transition-all duration-fast shadow-sm flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <><Loader2 size={18} className="animate-spin" /> Gönderiliyor...</>
                    ) : (
                      <><Send size={18} /> Teklifi Gönder</>
                    )}
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
