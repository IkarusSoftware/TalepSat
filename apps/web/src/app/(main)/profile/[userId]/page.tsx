'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, Star, CheckCircle, MapPin, Calendar,
  Shield, Briefcase, Award, FileText, MessageSquare,
} from 'lucide-react';
import { mockUsers, mockOffers, mockListings } from '@/lib/mock-data';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);
}

export default function PublicProfilePage() {
  const params = useParams();
  const user = mockUsers.find((u) => u.id === params.userId) || mockUsers[0];

  const isSeller = user.role === 'seller' || user.role === 'both';
  const isBuyer = user.role === 'buyer' || user.role === 'both';

  const badgeLabel: Record<string, string> = { pro: 'Pro Satıcı', plus: 'Plus Satıcı', basic: 'Basic' };
  const badgeColor: Record<string, string> = {
    pro: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    plus: 'bg-neutral-100 text-neutral-600 border-neutral-300 dark:bg-neutral-500/10 dark:text-neutral-400 dark:border-neutral-500/20',
    basic: 'bg-neutral-50 text-neutral-500 border-neutral-200 dark:bg-neutral-500/10 dark:text-neutral-400 dark:border-neutral-500/20',
  };

  // Recent activity
  const recentAcceptedOffers = useMemo(() => {
    if (!isSeller) return [];
    return mockOffers
      .filter((o) => o.sellerName === user.name && o.status === 'accepted')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3);
  }, [user.name, isSeller]);

  const recentListings = useMemo(() => {
    if (!isBuyer) return [];
    return mockListings
      .filter((l) => l.buyerName === user.name)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  }, [user.name, isBuyer]);

  // Seller stats
  const sellerOffers = mockOffers.filter((o) => o.sellerName === user.name);
  const acceptedCount = sellerOffers.filter((o) => o.status === 'accepted').length;
  const acceptRate = sellerOffers.length > 0 ? Math.round((acceptedCount / sellerOffers.length) * 100) : 0;

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
            {user.initials}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary">
                {user.name}
              </h1>
              {user.verified && <CheckCircle size={20} className="text-success" />}
              {user.badge && (
                <span className={`px-2.5 py-1 text-body-sm font-bold rounded-lg border ${badgeColor[user.badge]}`}>
                  {badgeLabel[user.badge]}
                </span>
              )}
            </div>

            {user.companyName && (
              <p className="text-body-lg text-neutral-500 mb-2">{user.companyName}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-body-md text-neutral-500 mb-4">
              <span className="flex items-center gap-1.5">
                <MapPin size={16} /> {user.city}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={16} /> {new Date(user.memberSince).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })} üyesi
              </span>
              <span className="flex items-center gap-1.5">
                <Star size={16} className="text-amber-400 fill-amber-400" />
                <strong className="text-neutral-900 dark:text-dark-textPrimary">{user.score}</strong> puan
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
              <p className="text-h3 font-bold text-success">%{acceptRate}</p>
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
            <p className="text-h3 font-bold text-neutral-900 dark:text-dark-textPrimary">{user.totalListings || 0}</p>
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

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Seller: Accepted Offers */}
        {isSeller && recentAcceptedOffers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.3 }}
            className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border/80 p-6"
          >
            <h3 className="text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary mb-4 flex items-center gap-2">
              <Award size={18} className="text-accent" />
              Tamamlanan İşler
            </h3>
            <div className="space-y-3">
              {recentAcceptedOffers.map((offer) => (
                <div key={offer.id} className="p-3 rounded-lg bg-neutral-50 dark:bg-dark-surfaceRaised">
                  <p className="text-body-md font-medium text-neutral-900 dark:text-dark-textPrimary line-clamp-1">{offer.listingTitle}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-body-sm text-neutral-400">{offer.listingCategory} · {offer.listingCity}</span>
                    <span className="text-body-md font-bold text-accent">{formatCurrency(offer.price)}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Buyer: Recent Listings */}
        {isBuyer && recentListings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.35 }}
            className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border/80 p-6"
          >
            <h3 className="text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary mb-4 flex items-center gap-2">
              <MessageSquare size={18} className="text-primary" />
              Son İlanlar
            </h3>
            <div className="space-y-3">
              {recentListings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/listing/${listing.id}`}
                  className="block p-3 rounded-lg bg-neutral-50 dark:bg-dark-surfaceRaised hover:bg-neutral-100 dark:hover:bg-dark-border/50 transition-colors"
                >
                  <p className="text-body-md font-medium text-neutral-900 dark:text-dark-textPrimary line-clamp-1">{listing.title}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-body-sm text-neutral-400">{listing.category} · {listing.city}</span>
                    <span className="text-body-md font-bold text-accent">{formatCurrency(listing.budgetMin)} — {formatCurrency(listing.budgetMax)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
