'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, UserCheck, BadgeCheck } from 'lucide-react';

const trustItems = [
  {
    icon: Shield,
    title: 'Escrow Ödeme Koruması',
    description:
      'Yüksek tutarlı işlemlerde paranız platform güvencesindedir. Teslimat tamamlanana kadar ödeme korunur.',
  },
  {
    icon: UserCheck,
    title: '5 Seviyeli Doğrulama',
    description:
      'Kimlik, adres, ticari belge ve yerinde doğrulama ile satıcıların güvenilirliği garanti altında.',
  },
  {
    icon: Lock,
    title: 'SSL & Veri Güvenliği',
    description:
      'Tüm verileriniz 256-bit SSL şifreleme ile korunur. KVKK ve GDPR uyumlu altyapı.',
  },
  {
    icon: BadgeCheck,
    title: 'Anlaşmazlık Yönetimi',
    description:
      'Herhangi bir sorun yaşarsanız, platform moderatörleri 24 saat içinde çözüm üretir.',
  },
];

export function TrustSection() {
  return (
    <section className="py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">
            Güvenle Ticaret Yap
          </h2>
          <p className="mt-4 text-lg text-neutral-500 max-w-2xl mx-auto">
            Her işlem, her aşamada platform güvencesi altında.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="p-6 rounded-xl border border-neutral-200/50 dark:border-dark-border bg-white dark:bg-dark-surface"
            >
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mb-4">
                <item.icon size={24} className="text-success" />
              </div>
              <h3 className="text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary mb-2">
                {item.title}
              </h3>
              <p className="text-body-md text-neutral-500 dark:text-dark-textSecondary leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
