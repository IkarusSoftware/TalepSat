'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Play, X, FileText, MessageSquare, BarChart3, Handshake } from 'lucide-react';

const howItWorksSteps = [
  {
    icon: FileText,
    title: 'İlanını Oluştur',
    description: 'Ne almak istediğini detaylıca yaz. Bütçeni, teslimat süresini ve şehrini belirt. Ücretsiz ve sadece 2 dakika.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: MessageSquare,
    title: 'Teklifleri Al',
    description: 'Doğrulanmış satıcılar ilanını görür ve sana rekabetçi teklifler gönderir. Ne kadar çok teklif, o kadar iyi fiyat.',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  {
    icon: BarChart3,
    title: 'Karşılaştır',
    description: 'Gelen teklifleri fiyat, teslimat süresi ve satıcı puanına göre karşılaştır. Karşı teklif gönderebilirsin.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Handshake,
    title: 'Anlaş & Tamamla',
    description: 'En uygun teklifi kabul et, teslimatı onayla ve satıcıyı değerlendir. Her iki taraf da birbirini puanlar.',
    color: 'text-success',
    bg: 'bg-success/10',
  },
];

export function HeroSection() {
  const [showModal, setShowModal] = useState(false);

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
                onClick={() => setShowModal(true)}
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

      {/* How It Works Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl bg-white dark:bg-dark-surface rounded-2xl shadow-2xl border border-neutral-200 dark:border-dark-border z-50 overflow-y-auto max-h-[90vh]"
            >
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary">
                      Nasıl Çalışır?
                    </h2>
                    <p className="text-body-md text-neutral-500 mt-1">
                      4 basit adımda ihtiyacını karşıla
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-surfaceRaised transition-colors"
                  >
                    <X size={20} className="text-neutral-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  {howItWorksSteps.map((step, i) => (
                    <motion.div
                      key={step.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.1 }}
                      className="flex items-start gap-4"
                    >
                      <div className="relative shrink-0">
                        <div className={`w-12 h-12 rounded-xl ${step.bg} flex items-center justify-center`}>
                          <step.icon size={24} className={step.color} />
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
                          {i + 1}
                        </div>
                      </div>
                      <div className="pt-1">
                        <h3 className="text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary mb-1">
                          {step.title}
                        </h3>
                        <p className="text-body-md text-neutral-500 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-8 flex gap-3">
                  <Link
                    href="/create"
                    onClick={() => setShowModal(false)}
                    className="flex-1 h-12 bg-accent text-white text-body-lg font-semibold rounded-xl hover:bg-accent-600 transition-colors flex items-center justify-center gap-2"
                  >
                    Hemen Başla <ArrowRight size={18} />
                  </Link>
                  <button
                    onClick={() => setShowModal(false)}
                    className="h-12 px-6 border border-neutral-200 dark:border-dark-border text-body-md font-medium text-neutral-600 dark:text-dark-textSecondary rounded-xl hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
