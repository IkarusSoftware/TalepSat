'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-6 py-32 md:py-40">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — Content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent-light text-accent text-body-sm font-semibold rounded-full mb-6">
                Türkiye&apos;nin İlk Reverse Marketplace&apos;i
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0, 0, 0.2, 1] }}
              className="text-4xl md:text-5xl lg:text-display font-extrabold text-neutral-900 dark:text-dark-textPrimary leading-tight tracking-tight"
            >
              İhtiyacını Yaz,{' '}
              <span className="text-accent">Satıcılar Yarışsın</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0, 0, 0.2, 1] }}
              className="mt-6 text-lg md:text-xl text-neutral-500 dark:text-dark-textSecondary leading-relaxed max-w-lg"
            >
              İlanını aç, satıcılardan teklifler gelsin, en uygununu seç.
              Klasik alışverişin tersine, burada{' '}
              <strong className="text-neutral-700 dark:text-dark-textPrimary">
                fiyatı sen belirle, teklifleri sen değerlendir.
              </strong>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0, 0, 0.2, 1] }}
              className="mt-10 flex flex-wrap gap-4"
            >
              <Link
                href="/create"
                className="inline-flex items-center gap-2 h-14 px-8 bg-accent text-white text-body-lg font-bold rounded-full hover:bg-accent-600 active:scale-[0.97] transition-all duration-fast shadow-md hover:shadow-lg"
              >
                İlan Oluştur
                <ArrowRight size={20} />
              </Link>
              <button
                className="inline-flex items-center gap-2 h-14 px-8 border-2 border-neutral-200 text-neutral-700 dark:text-dark-textPrimary dark:border-dark-border text-body-lg font-semibold rounded-full hover:border-neutral-300 hover:bg-neutral-100/50 dark:hover:bg-dark-surface active:scale-[0.97] transition-all duration-fast"
              >
                <Play size={18} className="text-accent" />
                Nasıl Çalışır?
              </button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-12 flex items-center gap-6 text-body-sm text-neutral-400"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-success" />
                </div>
                Ücretsiz ilan oluştur
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-success" />
                </div>
                Güvenli ödeme
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-success" />
                </div>
                Doğrulanmış satıcılar
              </div>
            </motion.div>
          </div>

          {/* Right — Visual / Mock */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0, 0, 0.2, 1] }}
            className="hidden lg:block relative"
          >
            {/* Mock listing card */}
            <div className="relative">
              <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl border border-neutral-200/50 dark:border-dark-border p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-body-md">
                    AY
                  </div>
                  <div>
                    <p className="text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary">
                      Ayşe Y.
                    </p>
                    <p className="text-body-sm text-neutral-400">
                      İstanbul &middot; 2 saat önce
                    </p>
                  </div>
                  <span className="ml-auto px-2.5 py-1 bg-success-light text-success text-body-sm font-medium rounded-sm">
                    Aktif
                  </span>
                </div>

                <h3 className="text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary mb-2">
                  500 Adet Ergonomik Ofis Sandalyesi
                </h3>
                <p className="text-body-md text-neutral-500 mb-4">
                  Yeni ofisimiz için mesh sırtlıklı, ayarlanabilir kol dayanaklı
                  ergonomik ofis sandalyesi temin etmek istiyoruz...
                </p>

                <div className="flex items-center gap-4 mb-6">
                  <div className="px-3 py-1.5 bg-neutral-100 dark:bg-dark-surfaceRaised rounded-md">
                    <p className="text-body-sm text-neutral-500">Bütçe</p>
                    <p className="text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary">
                      ₺250.000 - ₺400.000
                    </p>
                  </div>
                  <div className="px-3 py-1.5 bg-neutral-100 dark:bg-dark-surfaceRaised rounded-md">
                    <p className="text-body-sm text-neutral-500">Teslim</p>
                    <p className="text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary">
                      2 Hafta
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-dark-border">
                  <p className="text-body-md text-accent font-semibold">
                    12 teklif geldi
                  </p>
                  <button className="h-10 px-5 bg-accent text-white text-body-md font-semibold rounded-lg hover:bg-accent-600 transition-colors">
                    Teklif Ver
                  </button>
                </div>
              </div>

              {/* Floating offer notification */}
              <motion.div
                initial={{ opacity: 0, y: 20, x: -20 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                transition={{ duration: 0.4, delay: 0.8 }}
                className="absolute -bottom-6 -left-6 bg-white dark:bg-dark-surface rounded-xl shadow-lg border border-neutral-200/50 dark:border-dark-border px-4 py-3 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-success-light flex items-center justify-center">
                  <span className="text-success text-body-sm">✓</span>
                </div>
                <div>
                  <p className="text-body-sm font-medium text-neutral-900 dark:text-dark-textPrimary">
                    Yeni teklif geldi!
                  </p>
                  <p className="text-body-sm text-neutral-400">
                    ₺320.000 &middot; Mehmet K.
                  </p>
                </div>
              </motion.div>

              {/* Floating trust badge */}
              <motion.div
                initial={{ opacity: 0, y: -20, x: 20 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                transition={{ duration: 0.4, delay: 1 }}
                className="absolute -top-4 -right-4 bg-white dark:bg-dark-surface rounded-xl shadow-lg border border-neutral-200/50 dark:border-dark-border px-4 py-3 flex items-center gap-2"
              >
                <span className="text-xl">⭐</span>
                <div>
                  <p className="text-body-sm font-semibold text-neutral-900 dark:text-dark-textPrimary">
                    4.9 Puan
                  </p>
                  <p className="text-body-sm text-neutral-400">
                    Doğrulanmış Satıcı
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
