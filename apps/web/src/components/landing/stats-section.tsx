'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

interface StatsData {
  activeListings: number;
  completedDeals: number;
  verifiedSellers: number;
  satisfaction: number;
}

function CountUp({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!isInView || target === 0) return;

    const duration = 2000;
    const steps = 60;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(target * eased));

      if (step >= steps) {
        setCount(target);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={ref}>
      {count.toLocaleString('tr-TR')}
      {suffix}
    </span>
  );
}

export function StatsSection() {
  const [stats, setStats] = useState<StatsData>({
    activeListings: 0,
    completedDeals: 0,
    verifiedSellers: 0,
    satisfaction: 95,
  });

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((data) => {
        setStats({
          activeListings: data.activeListings || 0,
          completedDeals: data.completedDeals || 0,
          verifiedSellers: data.verifiedSellers || 0,
          satisfaction: data.satisfaction || 95,
        });
      })
      .catch(() => {});
  }, []);

  const statItems = [
    { value: stats.activeListings, suffix: '+', label: 'Aktif İlan' },
    { value: stats.completedDeals, suffix: '+', label: 'Başarılı İşlem' },
    { value: stats.verifiedSellers, suffix: '+', label: 'Doğrulanmış Satıcı' },
    { value: stats.satisfaction, suffix: '%', label: 'Müşteri Memnuniyeti' },
  ];

  return (
    <section className="py-16 bg-neutral-100 dark:bg-dark-surface">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {statItems.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="text-center"
            >
              <p className="text-3xl md:text-4xl font-extrabold text-neutral-900 dark:text-dark-textPrimary">
                <CountUp target={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-2 text-body-md text-neutral-500 dark:text-dark-textSecondary font-medium">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
