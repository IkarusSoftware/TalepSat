'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ListingMediaCard } from '@/components/listing/ListingMediaCard';

interface Listing {
  id: string;
  title: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  city: string;
  expiresAt: string;
  offerCount: number;
  buyerId?: string;
  buyerName?: string;
  buyerInitials: string;
  buyerScore?: number;
  buyerVerified?: boolean;
  buyerImage?: string | null;
  images: string[];
}

const fallbackListings: Listing[] = [
  {
    id: '1',
    title: '200 Adet Çalışma Masası - MDF, 120x60cm',
    category: 'Mobilya',
    budgetMin: 80000,
    budgetMax: 120000,
    city: 'İstanbul',
    expiresAt: new Date(Date.now() + 5 * 86400000).toISOString(),
    offerCount: 8,
    buyerInitials: 'MK',
    buyerName: 'Mert Kaya',
    buyerScore: 4.8,
    images: [],
  },
  {
    id: '2',
    title: '5.000 Adet Polo Yaka Tişört - Baskılı',
    category: 'Tekstil',
    budgetMin: 150000,
    budgetMax: 200000,
    city: 'İzmir',
    expiresAt: new Date(Date.now() + 3 * 86400000).toISOString(),
    offerCount: 14,
    buyerInitials: 'SA',
    buyerName: 'Selin Aras',
    buyerScore: 4.7,
    images: [],
  },
  {
    id: '3',
    title: '100 Adet Dizüstü Bilgisayar - i5, 16GB RAM',
    category: 'Elektronik',
    budgetMin: 500000,
    budgetMax: 650000,
    city: 'Ankara',
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    offerCount: 6,
    buyerInitials: 'EÖ',
    buyerName: 'Ece Özdemir',
    buyerScore: 4.9,
    images: [],
  },
  {
    id: '4',
    title: '10.000 Adet Kraft Kargo Kutusu - 30x20x15',
    category: 'Ambalaj',
    budgetMin: 25000,
    budgetMax: 35000,
    city: 'Bursa',
    expiresAt: new Date(Date.now() + 2 * 86400000).toISOString(),
    offerCount: 22,
    buyerInitials: 'DY',
    buyerName: 'Deniz Yılmaz',
    buyerScore: 4.6,
    images: [],
  },
];

export function FeaturedListingsSection() {
  const [listings, setListings] = useState<Listing[]>(fallbackListings);

  useEffect(() => {
    fetch('/api/listings?status=active')
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setListings(
            data.slice(0, 4).map((listing: Record<string, unknown>) => ({
              id: listing.id as string,
              title: listing.title as string,
              category: listing.category as string,
              budgetMin: listing.budgetMin as number,
              budgetMax: listing.budgetMax as number,
              city: listing.city as string,
              expiresAt: listing.expiresAt as string,
              offerCount: listing.offerCount as number,
              buyerId: listing.buyerId as string | undefined,
              buyerName: (listing.buyerName as string) || 'TalepSat Kullanıcısı',
              buyerInitials: (listing.buyerInitials as string) || 'TS',
              buyerScore: listing.buyerScore as number | undefined,
              buyerVerified: listing.buyerVerified as boolean | undefined,
              buyerImage: listing.buyerImage as string | null | undefined,
              images: Array.isArray(listing.images) ? (listing.images as string[]) : [],
            })),
          );
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="py-24 md:py-32 bg-white dark:bg-dark-bg">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">Öne Çıkan Talepler</h2>
            <p className="mt-3 text-lg text-neutral-500">Şu an en çok ilgi gören ilanlar</p>
          </motion.div>

          <Link
            href="/explore"
            className="hidden md:inline-flex items-center gap-2 text-body-md font-semibold text-accent hover:text-accent-600 transition-colors"
          >
            Tümünü Gör
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {listings.map((listing, index) => (
            <motion.article
              key={listing.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: index * 0.07, ease: [0, 0, 0.2, 1] }}
            >
              <ListingMediaCard listing={listing} variant="compact" />
            </motion.article>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-body-md font-semibold text-accent hover:text-accent-600 transition-colors"
          >
            Tüm İlanları Gör
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
