'use client';

import { motion } from 'framer-motion';
import {
  Sofa,
  Monitor,
  Shirt,
  Wrench,
  Utensils,
  Building2,
  Package,
  Truck,
  Palette,
  Stethoscope,
  GraduationCap,
  Leaf,
} from 'lucide-react';
import Link from 'next/link';

const categories = [
  { icon: Sofa, label: 'Mobilya', slug: 'mobilya', count: 342 },
  { icon: Monitor, label: 'Elektronik', slug: 'elektronik', count: 518 },
  { icon: Shirt, label: 'Tekstil', slug: 'tekstil', count: 276 },
  { icon: Wrench, label: 'Endüstriyel', slug: 'endustriyel', count: 189 },
  { icon: Utensils, label: 'Gıda', slug: 'gida', count: 421 },
  { icon: Building2, label: 'İnşaat', slug: 'insaat', count: 154 },
  { icon: Package, label: 'Ambalaj', slug: 'ambalaj', count: 203 },
  { icon: Truck, label: 'Lojistik', slug: 'lojistik', count: 97 },
  { icon: Palette, label: 'Reklam & Baskı', slug: 'reklam-baski', count: 165 },
  { icon: Stethoscope, label: 'Medikal', slug: 'medikal', count: 88 },
  { icon: GraduationCap, label: 'Eğitim', slug: 'egitim', count: 74 },
  { icon: Leaf, label: 'Tarım', slug: 'tarim', count: 132 },
];

export function CategoriesSection() {
  return (
    <section className="py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">
            Kategorilere Göz At
          </h2>
          <p className="mt-4 text-lg text-neutral-500 max-w-2xl mx-auto">
            Her sektörden talep, her kategoriden satıcı. İhtiyacına uygun
            kategoride ilan oluştur veya mevcut talepleri keşfet.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map((cat, index) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.4,
                delay: index * 0.05,
                ease: [0, 0, 0.2, 1],
              }}
            >
              <Link
                href={`/explore?category=${cat.slug}`}
                className="group flex flex-col items-center gap-3 p-6 rounded-xl border border-neutral-200/50 dark:border-dark-border bg-white dark:bg-dark-surface hover:shadow-md hover:scale-[1.03] hover:border-neutral-300 dark:hover:border-neutral-600 transition-all duration-normal"
              >
                <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-dark-surfaceRaised flex items-center justify-center group-hover:bg-accent/10 transition-colors duration-normal">
                  <cat.icon
                    size={24}
                    className="text-neutral-500 group-hover:text-accent transition-colors duration-normal"
                  />
                </div>
                <span className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary text-center">
                  {cat.label}
                </span>
                <span className="text-body-sm text-neutral-400">
                  {cat.count} ilan
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
