'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  TrendingUp,
  Shield,
  Zap,
} from 'lucide-react';

const benefits = [
  {
    icon: TrendingUp,
    title: 'Gerçek Müşteri Talebi',
    description: 'Stok riski yok. Sadece gerçek taleplere teklif ver.',
  },
  {
    icon: Shield,
    title: 'Güvenli Ödeme',
    description: 'Escrow sistemi ile paranız güvende. Teslimata kadar koruma.',
  },
  {
    icon: Zap,
    title: 'Hızlı Satış',
    description: 'Doğru müşteriyi aramak yerine, müşteri seni bulsun.',
  },
];

export function SellerCtaSection() {
  return (
    <section className="py-24 md:py-32 bg-primary dark:bg-primary-700 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-white rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 text-white/80 text-body-sm font-semibold rounded-full mb-6 backdrop-blur-sm">
              Satıcılar İçin
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
              Müşteri Aramayı Bırak,{' '}
              <span className="text-accent-light">Talepler Seni Bulsun</span>
            </h2>
            <p className="mt-6 text-lg text-white/70 leading-relaxed max-w-lg">
              Binlerce alıcı her gün ihtiyacını ilan olarak açıyor. Doğru
              kategoride teklif ver, satışını garanti et. Esnek abonelik
              paketleri ile başla.
            </p>
            <div className="mt-10">
              <Link
                href="/register?role=seller"
                className="inline-flex items-center gap-2 h-14 px-8 bg-accent text-white text-body-lg font-bold rounded-full hover:bg-accent-600 active:scale-[0.97] transition-all duration-fast shadow-lg hover:shadow-xl"
              >
                Satıcı Olarak Başla
                <ArrowRight size={20} />
              </Link>
            </div>
          </motion.div>

          {/* Right — Benefits */}
          <div className="space-y-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.12,
                  ease: [0, 0, 0.2, 1],
                }}
                className="flex items-start gap-4 p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
              >
                <div className="shrink-0 w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                  <benefit.icon size={24} className="text-accent" />
                </div>
                <div>
                  <h3 className="text-h4 font-semibold text-white mb-1">
                    {benefit.title}
                  </h3>
                  <p className="text-body-md text-white/60">
                    {benefit.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
