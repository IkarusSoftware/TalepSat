'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Bookmark, Loader2 } from 'lucide-react';
import { ListingMediaCard } from '@/components/listing/ListingMediaCard';

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
  buyerVerified?: boolean;
  buyerImage?: string | null;
  images: string[];
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200/60 bg-white dark:border-dark-border/80 dark:bg-dark-surface animate-pulse">
      <div className="aspect-video bg-neutral-200 dark:bg-dark-surfaceRaised" />
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="h-6 w-24 rounded-full bg-neutral-200 dark:bg-dark-surfaceRaised" />
          <div className="h-4 w-16 rounded bg-neutral-200 dark:bg-dark-surfaceRaised" />
        </div>
        <div className="h-5 w-4/5 rounded bg-neutral-200 dark:bg-dark-surfaceRaised mb-2" />
        <div className="h-5 w-2/5 rounded bg-neutral-200 dark:bg-dark-surfaceRaised mb-4" />
        <div className="flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-dark-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-dark-surfaceRaised" />
            <div className="h-4 w-14 rounded bg-neutral-200 dark:bg-dark-surfaceRaised" />
          </div>
          <div className="h-4 w-16 rounded bg-neutral-200 dark:bg-dark-surfaceRaised" />
        </div>
      </div>
    </div>
  );
}

export default function SavedPage() {
  const { status } = useSession();
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
      .then((response) => response.json())
      .then((data) => setListings(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [status]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">Kaydedilen İlanlar</h1>
        <p className="mt-2 text-body-lg text-neutral-500">Favorilediğiniz ilanları buradan takip edebilirsiniz.</p>
      </div>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing, index) => (
            <motion.article
              key={listing.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.05, ease: [0, 0, 0.2, 1] }}
            >
              <ListingMediaCard listing={listing} />
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}
