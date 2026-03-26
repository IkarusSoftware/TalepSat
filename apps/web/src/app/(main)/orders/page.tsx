'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, CheckCircle, Clock, Star, MapPin, ArrowRight,
  Loader2, ShoppingBag, Filter, ChevronRight, User, AlertCircle,
} from 'lucide-react';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Az önce';
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} gün önce`;
  return new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

interface OrderItem {
  id: string;
  price: number;
  deliveryDays: number;
  status: string;
  buyerConfirmed: boolean;
  sellerConfirmed: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  listingId: string;
  listingTitle: string;
  listingCategory: string;
  listingCity: string;
  isBuyer: boolean;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  sellerScore: number;
  sellerVerified: boolean;
  buyerName: string;
  buyerVerified: boolean;
  hasMyReview: boolean;
  myReviewRating: number | null;
  totalReviews: number;
}

type TabFilter = 'buyer' | 'seller' | 'completed';

export default function OrdersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabFilter>('buyer');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/orders')
      .then((r) => r.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (tab === 'buyer') return orders.filter((o) => o.isBuyer);
    if (tab === 'seller') return orders.filter((o) => !o.isBuyer);
    if (tab === 'completed') return orders.filter((o) => o.status === 'completed');
    return orders;
  }, [orders, tab]);

  const counts = useMemo(() => ({
    buyer: orders.filter((o) => o.isBuyer).length,
    seller: orders.filter((o) => !o.isBuyer).length,
    completed: orders.filter((o) => o.status === 'completed').length,
  }), [orders]);

  async function handleConfirm(orderId: string) {
    setConfirmingId(orderId);
    try {
      const res = await fetch(`/api/offers/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm' }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: updated.status,
                  buyerConfirmed: updated.buyerConfirmed,
                  sellerConfirmed: updated.sellerConfirmed,
                  completedAt: updated.completedAt,
                }
              : o
          )
        );
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Onaylama başarısız');
      }
    } finally {
      setConfirmingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary flex items-center gap-3">
          <Package size={28} className="text-accent" />
          Siparişlerim
        </h1>
        <p className="mt-2 text-body-lg text-neutral-500">
          Kabul edilen teklifler ve tamamlanan siparişler
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-neutral-200 dark:border-dark-border pb-0">
        {([
          { key: 'buyer', label: 'Aldıklarım' },
          { key: 'seller', label: 'Sattıklarım' },
          { key: 'completed', label: 'Tamamlanan' },
        ] as { key: TabFilter; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-body-md font-medium transition-colors relative ${
              tab === t.key
                ? 'text-accent'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-dark-textPrimary'
            }`}
          >
            {t.label}
            {counts[t.key] > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 text-[11px] font-bold rounded-full ${
                tab === t.key ? 'bg-accent/10 text-accent' : 'bg-neutral-100 dark:bg-dark-surfaceRaised text-neutral-500'
              }`}>
                {counts[t.key]}
              </span>
            )}
            {tab === t.key && (
              <motion.div layoutId="orderTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <ShoppingBag size={48} className="mx-auto mb-4 text-neutral-200 dark:text-neutral-600" />
          <h3 className="text-h4 font-semibold text-neutral-600 dark:text-dark-textSecondary mb-2">
            {tab === 'buyer' ? 'Aldığınız sipariş yok' : tab === 'seller' ? 'Sattığınız sipariş yok' : 'Tamamlanan sipariş yok'}
          </h3>
          <p className="text-body-md text-neutral-400 mb-4">
            Bir teklif kabul edildiğinde siparişler burada görünür.
          </p>
          <Link href="/explore" className="text-accent hover:text-accent-600 text-body-md font-medium">
            İlanları Keşfet &rarr;
          </Link>
        </motion.div>
      )}

      {/* Order list */}
      <div className="space-y-4">
        <AnimatePresence>
          {filtered.map((order, i) => {
            const myConfirmed = order.isBuyer ? order.buyerConfirmed : order.sellerConfirmed;
            const otherConfirmed = order.isBuyer ? order.sellerConfirmed : order.buyerConfirmed;
            const isActive = order.status === 'accepted';
            const isCompleted = order.status === 'completed';
            const needsMyConfirmation = isActive && !myConfirmed;
            const otherName = order.isBuyer ? order.sellerName : order.buyerName;
            const otherVerified = order.isBuyer ? order.sellerVerified : order.buyerVerified;
            const otherRole = order.isBuyer ? 'Satıcı' : 'Alıcı';
            const otherId = order.isBuyer ? order.sellerId : order.buyerId;
            const otherInitials = otherName
              ? otherName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
              : '??';

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-white dark:bg-dark-surface rounded-xl border overflow-hidden transition-all hover:shadow-md ${
                  needsMyConfirmation
                    ? 'border-accent/30 shadow-sm shadow-accent/5'
                    : 'border-neutral-200/50 dark:border-dark-border/80'
                }`}
              >
                {/* Needs confirmation banner */}
                {needsMyConfirmation && (
                  <div className="px-5 py-2.5 bg-accent/5 border-b border-accent/10 flex items-center gap-2">
                    <AlertCircle size={16} className="text-accent" />
                    <span className="text-body-sm font-medium text-accent">
                      {otherConfirmed
                        ? `Karşı taraf onayladı — sizin onayınız bekleniyor`
                        : 'Teslimat tamamlandıysa onaylayın'}
                    </span>
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Other party avatar */}
                    <Link href={`/profile/${otherId}`} className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-body-md shrink-0 hover:ring-2 hover:ring-accent/30 transition-all">
                      {otherInitials}
                    </Link>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <Link
                            href={`/listing/${order.listingId}`}
                            className="text-body-lg font-semibold text-neutral-900 dark:text-dark-textPrimary hover:text-accent transition-colors line-clamp-1"
                          >
                            {order.listingTitle}
                          </Link>
                          <div className="flex items-center gap-2 mt-1 text-body-sm text-neutral-500">
                            <span>{order.listingCategory}</span>
                            <span className="text-neutral-300">·</span>
                            <span className="flex items-center gap-1"><MapPin size={12} /> {order.listingCity}</span>
                          </div>
                        </div>

                        {/* Status badge */}
                        <div className="shrink-0">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-body-sm font-semibold rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                              <CheckCircle size={14} /> Tamamlandı
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-body-sm font-semibold rounded-lg border border-amber-200 dark:border-amber-500/20">
                              <Clock size={14} /> Aktif
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Seller info + price */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-body-sm text-neutral-500">
                            <User size={13} />
                            <span className="text-neutral-400">{otherRole}:</span>
                            <Link href={`/profile/${otherId}`} className="font-medium text-neutral-700 dark:text-dark-textPrimary hover:text-accent transition-colors">{otherName}</Link>
                            {otherVerified && <CheckCircle size={12} className="text-success" />}
                            {order.isBuyer && order.sellerScore > 0 && (
                              <span className="flex items-center gap-0.5 text-amber-600">
                                <Star size={12} className="fill-amber-400 text-amber-400" />
                                {order.sellerScore}
                              </span>
                            )}
                          </div>
                          <span className="text-neutral-300">·</span>
                          <span className="text-body-sm text-neutral-400">{order.deliveryDays} gün teslimat</span>
                        </div>
                        <span className="text-h4 font-bold text-accent">{formatCurrency(order.price)}</span>
                      </div>

                      {/* Confirmation status */}
                      {isActive && (
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-neutral-100 dark:border-dark-border">
                          <div className="flex items-center gap-1.5 text-body-sm">
                            {order.buyerConfirmed ? (
                              <CheckCircle size={14} className="text-success" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full border-2 border-neutral-300 dark:border-neutral-600" />
                            )}
                            <span className={order.buyerConfirmed ? 'text-success font-medium' : 'text-neutral-400'}>
                              Alıcı {order.buyerConfirmed ? 'onayladı' : 'bekliyor'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-body-sm">
                            {order.sellerConfirmed ? (
                              <CheckCircle size={14} className="text-success" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full border-2 border-neutral-300 dark:border-neutral-600" />
                            )}
                            <span className={order.sellerConfirmed ? 'text-success font-medium' : 'text-neutral-400'}>
                              Satıcı {order.sellerConfirmed ? 'onayladı' : 'bekliyor'}
                            </span>
                          </div>
                          <span className="text-body-sm text-neutral-300 ml-auto">{timeAgo(order.updatedAt)}</span>
                        </div>
                      )}

                      {/* Completed: review info */}
                      {isCompleted && (
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-neutral-100 dark:border-dark-border">
                          {order.hasMyReview ? (
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  size={14}
                                  className={s <= (order.myReviewRating ?? 0) ? 'text-amber-400 fill-amber-400' : 'text-neutral-200 dark:text-neutral-600'}
                                />
                              ))}
                              <span className="text-body-sm font-medium text-neutral-600 dark:text-dark-textSecondary ml-1">
                                Değerlendirdiniz
                              </span>
                            </div>
                          ) : (
                            <span className="text-body-sm text-amber-600 dark:text-amber-400 font-medium">
                              Henüz değerlendirmediniz
                            </span>
                          )}
                          {order.totalReviews > 0 && (
                            <span className="text-body-sm text-neutral-400">
                              ({order.totalReviews} değerlendirme)
                            </span>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-3 mt-4">
                        {/* Confirm button */}
                        {needsMyConfirmation && (
                          <button
                            onClick={() => handleConfirm(order.id)}
                            disabled={confirmingId === order.id}
                            className="h-10 px-5 bg-accent text-white text-body-sm font-semibold rounded-lg hover:bg-accent-600 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
                          >
                            {confirmingId === order.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <CheckCircle size={16} />
                            )}
                            Teslimatı Onayla
                          </button>
                        )}

                        {/* Rate button — both buyer and seller can rate */}
                        {isCompleted && !order.hasMyReview && (
                          <Link
                            href={`/offers/${order.id}`}
                            className="h-10 px-5 bg-amber-500 text-white text-body-sm font-semibold rounded-lg hover:bg-amber-600 active:scale-[0.98] transition-all flex items-center gap-2"
                          >
                            <Star size={16} />
                            Puan Ver
                          </Link>
                        )}

                        {/* Detail link */}
                        <Link
                          href={`/offers/${order.id}`}
                          className="h-10 px-4 border border-neutral-200 dark:border-dark-border text-body-sm font-medium text-neutral-600 dark:text-dark-textSecondary rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors flex items-center gap-2"
                        >
                          Detay <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
