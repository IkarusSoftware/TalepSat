'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { MapPin, Clock, MessageSquare, ArrowRight } from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  city: string;
  expiresAt: string;
  offerCount: number;
  buyerInitials: string;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);
}

function getDaysLeft(expiresAt: string) {
  const days = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 86400000));
  return `${days} gün kaldı`;
}

// Fallback data for when there are no listings yet
const fallbackListings: Listing[] = [
  { id: '1', title: '200 Adet Çalışma Masası — MDF, 120x60cm', category: 'Mobilya', budgetMin: 80000, budgetMax: 120000, city: 'İstanbul', expiresAt: new Date(Date.now() + 5 * 86400000).toISOString(), offerCount: 8, buyerInitials: 'MK' },
  { id: '2', title: '5.000 Adet Polo Yaka Tişört — Baskılı', category: 'Tekstil', budgetMin: 150000, budgetMax: 200000, city: 'İzmir', expiresAt: new Date(Date.now() + 3 * 86400000).toISOString(), offerCount: 14, buyerInitials: 'SA' },
  { id: '3', title: '100 Adet Dizüstü Bilgisayar — i5, 16GB RAM', category: 'Elektronik', budgetMin: 500000, budgetMax: 650000, city: 'Ankara', expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), offerCount: 6, buyerInitials: 'EÖ' },
  { id: '4', title: '10.000 Adet Kraft Kargo Kutusu — 30x20x15', category: 'Ambalaj', budgetMin: 25000, budgetMax: 35000, city: 'Bursa', expiresAt: new Date(Date.now() + 2 * 86400000).toISOString(), offerCount: 22, buyerInitials: 'DY' },
];

export function FeaturedListingsSection() {
  const [listings, setListings] = useState<Listing[]>(fallbackListings);

  useEffect(() => {
    fetch('/api/listings?status=active')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setListings(data.slice(0, 4).map((l: Record<string, unknown>) => ({
            id: l.id as string,
            title: l.title as string,
            category: l.category as string,
            budgetMin: l.budgetMin as number,
            budgetMax: l.budgetMax as number,
            city: l.city as string,
            expiresAt: l.expiresAt as string,
            offerCount: l.offerCount as number,
            buyerInitials: (l.buyerInitials as string) || 'U',
          })));
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
            <h2 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">
              Öne Çıkan Talepler
            </h2>
            <p className="mt-3 text-lg text-neutral-500">
              Şu an en çok ilgi gören ilanlar
            </p>
          </motion.div>
          <Link
            href="/explore"
            className="hidden md:inline-flex items-center gap-2 text-body-md font-semibold text-accent hover:text-accent-600 transition-colors"
          >
            Tümünü Gör
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {listings.map((listing, index) => (
            <motion.article
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.4,
                delay: index * 0.08,
                ease: [0, 0, 0.2, 1],
              }}
            >
              <Link
                href={`/listing/${listing.id}`}
                className="group block h-full rounded-xl border border-neutral-200/50 dark:border-dark-border bg-white dark:bg-dark-surface p-6 hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-600 hover:scale-[1.01] transition-all duration-normal"
              >
                <span className="inline-block px-2.5 py-1 bg-primary-lighter dark:bg-primary/20 text-primary dark:text-blue-300 text-body-sm font-medium rounded-sm mb-3">
                  {listing.category}
                </span>

                <h3 className="text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary mb-3 line-clamp-2 group-hover:text-accent transition-colors">
                  {listing.title}
                </h3>

                <p className="text-body-lg font-bold text-accent mb-4">
                  {formatCurrency(listing.budgetMin)} - {formatCurrency(listing.budgetMax)}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-body-sm text-neutral-400 mb-4">
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={14} />
                    {listing.city}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={14} />
                    {getDaysLeft(listing.expiresAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-dark-border">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-dark-surfaceRaised flex items-center justify-center text-body-sm font-semibold text-neutral-600 dark:text-dark-textSecondary">
                      {listing.buyerInitials}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-body-sm font-medium text-accent">
                    <MessageSquare size={14} />
                    {listing.offerCount} teklif
                  </span>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>

        <div className="md:hidden mt-8 text-center">
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
