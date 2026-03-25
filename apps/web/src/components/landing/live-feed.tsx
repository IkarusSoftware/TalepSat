'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const feedItems = [
  { city: 'İstanbul', item: '500 adet ofis sandalyesi', time: '2 dk önce' },
  { city: 'Ankara', item: '200 adet karton kutu', time: '5 dk önce' },
  { city: 'İzmir', item: '1000 metre kumaş', time: '8 dk önce' },
  { city: 'Bursa', item: '50 adet endüstriyel raf', time: '12 dk önce' },
  { city: 'Antalya', item: '300 adet promosyon tişört', time: '15 dk önce' },
  { city: 'Konya', item: '100 adet tablet kılıfı', time: '18 dk önce' },
  { city: 'Gaziantep', item: '2 ton çelik profil', time: '22 dk önce' },
  { city: 'Trabzon', item: '500 adet ambalaj poşeti', time: '25 dk önce' },
];

export function LiveFeedSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % feedItems.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const visibleItems = [
    feedItems[currentIndex],
    feedItems[(currentIndex + 1) % feedItems.length],
    feedItems[(currentIndex + 2) % feedItems.length],
  ];

  return (
    <section className="py-16 bg-neutral-50 dark:bg-dark-bg overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-success" />
          </div>
          <h3 className="text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary">
            Canlı Talep Akışı
          </h3>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {visibleItems.map((item, i) => (
              <motion.div
                key={`${item.city}-${item.item}-${currentIndex}-${i}`}
                layout
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1 - i * 0.25, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35, ease: [0, 0, 0.2, 1] }}
                className="flex items-center gap-4 bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border px-5 py-4 shadow-sm"
              >
                <div className="shrink-0 w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <span className="text-accent text-body-lg">📦</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-md text-neutral-900 dark:text-dark-textPrimary truncate">
                    <strong>{item.city}</strong>&apos;dan{' '}
                    <strong>{item.item}</strong> talep edildi
                  </p>
                </div>
                <span className="shrink-0 text-body-sm text-neutral-400">
                  {item.time}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
