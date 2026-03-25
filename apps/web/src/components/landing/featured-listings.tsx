'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { MapPin, Clock, MessageSquare, ArrowRight } from 'lucide-react';

const listings = [
  {
    id: '1',
    category: 'Mobilya',
    title: '200 Adet Çalışma Masası — MDF, 120x60cm',
    budget: '₺80.000 - ₺120.000',
    location: 'İstanbul',
    timeLeft: '5 gün kaldı',
    offers: 8,
    buyerInitials: 'MK',
  },
  {
    id: '2',
    category: 'Tekstil',
    title: '5.000 Adet Polo Yaka Tişört — Baskılı',
    budget: '₺150.000 - ₺200.000',
    location: 'İzmir',
    timeLeft: '3 gün kaldı',
    offers: 14,
    buyerInitials: 'SA',
  },
  {
    id: '3',
    category: 'Elektronik',
    title: '100 Adet Dizüstü Bilgisayar — i5, 16GB RAM',
    budget: '₺500.000 - ₺650.000',
    location: 'Ankara',
    timeLeft: '7 gün kaldı',
    offers: 6,
    buyerInitials: 'EÖ',
  },
  {
    id: '4',
    category: 'Ambalaj',
    title: '10.000 Adet Kraft Kargo Kutusu — 30x20x15',
    budget: '₺25.000 - ₺35.000',
    location: 'Bursa',
    timeLeft: '2 gün kaldı',
    offers: 22,
    buyerInitials: 'DY',
  },
];

export function FeaturedListingsSection() {
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
                {/* Category badge */}
                <span className="inline-block px-2.5 py-1 bg-primary-lighter dark:bg-primary/20 text-primary dark:text-blue-300 text-body-sm font-medium rounded-sm mb-3">
                  {listing.category}
                </span>

                {/* Title */}
                <h3 className="text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary mb-3 line-clamp-2 group-hover:text-accent transition-colors">
                  {listing.title}
                </h3>

                {/* Budget */}
                <p className="text-body-lg font-bold text-accent mb-4">
                  {listing.budget}
                </p>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-3 text-body-sm text-neutral-400 mb-4">
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={14} />
                    {listing.location}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={14} />
                    {listing.timeLeft}
                  </span>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-dark-border">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-dark-surfaceRaised flex items-center justify-center text-body-sm font-semibold text-neutral-600 dark:text-dark-textSecondary">
                      {listing.buyerInitials}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-body-sm font-medium text-accent">
                    <MessageSquare size={14} />
                    {listing.offers} teklif
                  </span>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>

        {/* Mobile CTA */}
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
