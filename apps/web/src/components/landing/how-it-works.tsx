'use client';

import { motion } from 'framer-motion';
import { FileText, Users, CheckCircle } from 'lucide-react';

const steps = [
  {
    icon: FileText,
    title: 'İlanını Oluştur',
    description:
      'İhtiyacın olan ürün veya hizmeti detaylı şekilde tanımla. Bütçeni, teslim beklentini ve referans görsellerini ekle.',
    accent: 'bg-primary/10 text-primary',
  },
  {
    icon: Users,
    title: 'Teklifler Gelsin',
    description:
      'Doğrulanmış satıcılar ilanını inceleyip sana en uygun tekliflerini göndersin. Fiyat, süre ve kalite sana gelsin.',
    accent: 'bg-accent/10 text-accent',
  },
  {
    icon: CheckCircle,
    title: 'En Uygununu Seç',
    description:
      'Teklifleri karşılaştır, satıcı profillerini incele ve en güvenilir, en uygun teklifi kabul et.',
    accent: 'bg-success/10 text-success',
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 md:py-32 bg-white dark:bg-dark-bg">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary">
            Nasıl Çalışır?
          </h2>
          <p className="mt-4 text-lg text-neutral-500 dark:text-dark-textSecondary max-w-2xl mx-auto">
            3 basit adımda ihtiyacını karşıla. Klasik alışverişin aksine,
            burada satıcılar sana gelir.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-neutral-200 dark:bg-dark-border" />

          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{
                duration: 0.5,
                delay: index * 0.15,
                ease: [0, 0, 0.2, 1],
              }}
              className="relative text-center"
            >
              {/* Step number */}
              <div className="relative z-10 mx-auto mb-6 w-16 h-16 rounded-2xl flex items-center justify-center bg-white dark:bg-dark-surface border-2 border-neutral-100 dark:border-dark-border shadow-sm">
                <step.icon size={28} className={step.accent.split(' ')[1]} />
              </div>

              {/* Number badge */}
              <div className="absolute top-0 left-1/2 ml-6 -mt-1 w-6 h-6 rounded-full bg-accent text-white text-body-sm font-bold flex items-center justify-center z-20">
                {index + 1}
              </div>

              <h3 className="text-h3 font-semibold text-neutral-900 dark:text-dark-textPrimary mb-3">
                {step.title}
              </h3>
              <p className="text-body-lg text-neutral-500 dark:text-dark-textSecondary leading-relaxed max-w-sm mx-auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
