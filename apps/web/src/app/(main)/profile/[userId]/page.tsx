'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, Star, CheckCircle, MapPin, Calendar,
  Shield, Briefcase, Award, FileText, MessageSquare,
  Loader2,
} from 'lucide-react';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);
}

interface UserProfile {
  id: string;
  name: string;
  image: string | null;
  bio: string | null;
  city: string | null;
  companyName: string | null;
  verified: boolean;
  badge: string | null;
  score: number;
  completedDeals: number;
  role: string;
  createdAt: string;
  listingCount: number;
  totalOffers: number;
  acceptedOffers: number;
  acceptRate: number;
  reviewCount: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: { id: string; name: string; image: string | null };
  offer: {
    id: string;
    price: number;
    listing: { id: string; title: string; category: string; city: string };
  };
}

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.userId as string;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [userRes, reviewsRes] = await Promise.all([
          fetch(`/api/users/${userId}`),
          fetch(`/api/users/${userId}/reviews`),
        ]);
        if (!userRes.ok) { setNotFound(true); return; }
        setUser(await userRes.json());
        if (reviewsRes.ok) setReviews(await reviewsRes.json());
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userId]);

  const isSeller = user ? (user.role === 'seller' || user.role === 'both') : false;
  const isBuyer = user ? (user.role === 'buyer' || user.role === 'both') : false;

  const badgeLabel: Record<string, string> = { pro: 'Pro Satıcı', plus: 'Plus Satıcı', basic: 'Basic' };
  const badgeColor: Record<string, string> = {
    pro: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    plus: 'bg-neutral-100 text-neutral-600 border-neutral-300 dark:bg-neutral-500/10 dark:text-neutral-400 dark:border-neutral-500/20',
    basic: 'bg-neutral-50 text-neutral-500 border-neutral-200 dark:bg-neutral-500/10 dark:text-neutral-400 dark:border-neutral-500/20',
  };

  const initials = user ? user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) : '';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <FileText size={48} className="text-neutral-300" />
        <h2 className="text-h3 font-semibold text-neutral-700 dark:text-dark-textPrimary">Kullanıcı Bulunamadı</h2>
        <Link href="/explore" className="text-primary hover:underline text-body-md">
          Keşfete Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Back */}
      <Link href="/explore" className="inline-flex items-center gap-1 text-body-sm text-neutral-400 hover:text-neutral-600 transition-colors mb-6">
        <ArrowLeft size={14} /> Geri
      </Link>

      {/* Profile header card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border/80 p-6 md:p-8 mb-6"
      >
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-h1 shrink-0">
            {initials}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary">
                {user.name}
              </h1>
              {user.verified && <CheckCircle size={20} className="text-success" />}
              {user.badge && (
                <span className={`px-2.5 py-1 text-body-sm font-bold rounded-lg border ${badgeColor[user.badge] || badgeColor.basic}`}>
                  {badgeLabel[user.badge] || user.badge}
                </span>
              )}
            </div>

            {user.companyName && (
              <p className="text-body-lg text-neutral-500 mb-2">{user.companyName}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-body-md text-neutral-500 mb-4">
              {user.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={16} /> {user.city}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar size={16} /> {new Date(user.createdAt).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })} üyesi
              </span>
              <span className="flex items-center gap-1.5">
                <Star size={16} className="text-amber-400 fill-amber-400" />
                <strong className="text-neutral-900 dark:text-dark-textPrimary">{user.score}</strong> puan
                {user.reviewCount > 0 && (
                  <span className="text-neutral-400">({user.reviewCount} değerlendirme)</span>
                )}
              </span>
            </div>

            {user.bio && (
              <p className="text-body-lg text-neutral-600 dark:text-dark-textSecondary leading-relaxed">
                {user.bio}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {isSeller && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border/80 p-4 text-center"
            >
              <Briefcase size={20} className="mx-auto mb-2 text-accent" />
              <p className="text-h3 font-bold text-neutral-900 dark:text-dark-textPrimary">{user.completedDeals}</p>
              <p className="text-body-sm text-neutral-500">Tamamlanan İş</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border/80 p-4 text-center"
            >
              <CheckCircle size={20} className="mx-auto mb-2 text-success" />
              <p className="text-h3 font-bold text-success">%{user.acceptRate}</p>
              <p className="text-body-sm text-neutral-500">Kabul Oranı</p>
            </motion.div>
          </>
        )}
        {isBuyer && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border/80 p-4 text-center"
          >
            <FileText size={20} className="mx-auto mb-2 text-primary" />
            <p className="text-h3 font-bold text-neutral-900 dark:text-dark-textPrimary">{user.listingCount}</p>
            <p className="text-body-sm text-neutral-500">Toplam İlan</p>
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border/80 p-4 text-center"
        >
          <Star size={20} className="mx-auto mb-2 text-amber-400" />
          <p className="text-h3 font-bold text-neutral-900 dark:text-dark-textPrimary">{user.score}</p>
          <p className="text-body-sm text-neutral-500">Ortalama Puan</p>
        </motion.div>
        {user.verified && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border/80 p-4 text-center"
          >
            <Shield size={20} className="mx-auto mb-2 text-success" />
            <p className="text-h3 font-bold text-success">Evet</p>
            <p className="text-body-sm text-neutral-500">Doğrulanmış</p>
          </motion.div>
        )}
      </div>

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
          className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border/80 p-6 mb-6"
        >
          <h3 className="text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary mb-5 flex items-center gap-2">
            <Award size={18} className="text-amber-400" />
            Değerlendirmeler ({reviews.length})
          </h3>
          <div className="space-y-4">
            {reviews.map((review) => {
              const reviewerInitials = review.reviewer.name
                .split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
              return (
                <div key={review.id} className="p-4 rounded-xl bg-neutral-50 dark:bg-dark-surfaceRaised">
                  <div className="flex items-start gap-3">
                    <Link href={`/profile/${review.reviewer.id}`} className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-body-sm shrink-0 hover:ring-2 hover:ring-accent/30 transition-all">
                      {reviewerInitials}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Link href={`/profile/${review.reviewer.id}`} className="text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary hover:text-accent transition-colors">
                            {review.reviewer.name}
                          </Link>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={14}
                                className={s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-200 dark:text-neutral-600'}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-[11px] text-neutral-400 shrink-0">
                          {new Date(review.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      {review.comment && (
                        <p className="text-body-md text-neutral-600 dark:text-dark-textSecondary leading-relaxed mb-2">
                          {review.comment}
                        </p>
                      )}

                      <Link
                        href={`/listing/${review.offer.listing.id}`}
                        className="inline-flex items-center gap-1.5 text-body-sm text-accent hover:text-accent-600 transition-colors"
                      >
                        <MessageSquare size={12} />
                        {review.offer.listing.title}
                        <span className="text-neutral-400">·</span>
                        <span className="text-neutral-400">{formatCurrency(review.offer.price)}</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Empty reviews state */}
      {reviews.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
          className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border/80 p-8 text-center"
        >
          <Star size={32} className="mx-auto mb-3 text-neutral-200 dark:text-neutral-600" />
          <p className="text-body-lg font-medium text-neutral-500">Henüz değerlendirme yok</p>
          <p className="text-body-sm text-neutral-400 mt-1">Tamamlanan siparişler sonrası değerlendirmeler burada görünecek.</p>
        </motion.div>
      )}
    </div>
  );
}
