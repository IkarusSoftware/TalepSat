'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Bookmark, Clock, MapPin, MessageSquare, Star, Loader2,
} from 'lucide-react';

interface ListingItem {
  id: string;
  title: string;
  description: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  city: string;
  deliveryUrgency: string;
  viewCount: number;
  offerCount: number;
  status: string;
  expiresAt: string;
  createdAt: string;
  buyerId: string;
  buyerName: string;
  buyerInitials: string;
  buyerScore: number;
}

function formatBudget(min: number, max: number) {
  const fmt = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${Math.floor(n / 1000)}K`;
    return n.toString();
  };
  return `₺${fmt(min)} - ₺${fmt(max)}`;
}

function getTimeLeft(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  const days = Math.max(0, Math.floor(diff / 86400000));
  if (days === 0) return 'Bugün bitiyor';
  return `${days} gün kaldı`;
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-neutral-200/50 dark:border-dark-border/80 bg-white dark:bg-dark-surface p-6 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-6 w-24 bg-neutral-200 dark:bg-dark-surfaceRaised rounded" />
        <div className="h-4 w-20 bg-neutral-200 dark:bg-dark-surfaceRaised rounded" />
      </div>
      <div className="h-5 w-3/4 bg-neutral-200 dark:bg-dark-surfaceRaised rounded mb-2" />
      <div className="h-5 w-1/3 bg-neutral-200 dark:bg-dark-surfaceRaised rounded mb-3" />
      <div className="flex gap-3 mb-4">
        <div className="h-4 w-20 bg-neutral-200 dark:bg-dark-surfaceRaised rounded" />
        <div className="h-4 w-16 bg-neutral-200 dark:bg-dark-surfaceRaised rounded" />
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-dark-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-dark-surfaceRaised" />
          <div className="h-4 w-12 bg-neutral-200 dark:bg-dark-surfaceRaised rounded" />
        </div>
        <div className="h-4 w-16 bg-neutral-200 dark:bg-dark-surfaceRaised rounded" />
      </div>
    </div>
  );
}

export default function SavedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/listings/favorites')
      .then((r) => r.json())
      .then((data) => setListings(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [status]);

  if (status === 'loading' || (status === 'unauthenticated')) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">
          Kaydedilen İlanlar
        </h1>
        <p className="mt-2 text-body-lg text-neutral-500">
          Favorilediğiniz ilanları buradan takip edebilirsiniz.
        </p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral-100 dark:bg-dark-surfaceRaised flex items-center justify-center">
            <Bookmark size={28} className="text-neutral-400" />
          </div>
          <h3 className="text-h3 font-semibold text-neutral-700 dark:text-dark-textPrimary mb-2">
            Henüz kaydettiğiniz ilan yok
          </h3>
          <p className="text-body-lg text-neutral-500 mb-6">
            İlanlara göz atın ve beğendiklerinizi kalp butonuyla kaydedin.
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 h-11 px-6 bg-accent text-white text-body-md font-semibold rounded-full hover:bg-accent-600 active:scale-[0.97] transition-all duration-fast shadow-sm hover:shadow-md"
          >
            İlanları Keşfet
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((listing, index) => (
            <motion.article
              key={listing.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.05, ease: [0, 0, 0.2, 1] }}
            >
              <div className="group relative h-full rounded-xl border border-neutral-200/50 dark:border-dark-border/80 bg-white dark:bg-dark-surface hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-500 hover:scale-[1.01] transition-all duration-normal">
                <Link href={`/listing/${listing.id}`} className="block p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 bg-primary-lighter dark:bg-primary/20 text-primary dark:text-blue-300 text-body-sm font-medium rounded-sm">
                      {listing.category}
                    </span>
                    <span className="text-body-sm text-neutral-400 flex items-center gap-1">
                      <Clock size={13} />
                      {getTimeLeft(listing.expiresAt)}
                    </span>
                  </div>
                  <h3 className="text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary mb-2 line-clamp-2 group-hover:text-accent transition-colors">
                    {listing.title}
                  </h3>
                  <p className="text-body-lg font-bold text-accent mb-3">
                    {formatBudget(listing.budgetMin, listing.budgetMax)}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-body-sm text-neutral-400 mb-4">
                    <span className="flex items-center gap-1">
                      <MapPin size={13} /> {listing.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} /> {listing.deliveryUrgency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-dark-border">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-dark-surfaceRaised flex items-center justify-center text-[11px] font-semibold text-neutral-600 dark:text-dark-textSecondary">
                        {listing.buyerInitials}
                      </div>
                      <div className="flex items-center gap-1 text-body-sm text-neutral-500">
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                        {listing.buyerScore}
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-body-sm font-semibold text-accent">
                      <MessageSquare size={14} />
                      {listing.offerCount} teklif
                    </span>
                  </div>
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}
