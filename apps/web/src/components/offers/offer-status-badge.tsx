'use client';

const statusConfig = {
  pending: { label: 'Bekliyor', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-500/20' },
  accepted: { label: 'Kabul Edildi', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/20' },
  rejected: { label: 'Reddedildi', bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-500/20' },
  counter_offered: { label: 'Karşı Teklif', bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-500/20' },
  withdrawn: { label: 'Geri Çekildi', bg: 'bg-neutral-100 dark:bg-neutral-500/10', text: 'text-neutral-500 dark:text-neutral-400', border: 'border-neutral-200 dark:border-neutral-500/20' },
} as const;

type OfferStatus = keyof typeof statusConfig;

export function OfferStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as OfferStatus] || statusConfig.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-body-sm font-semibold rounded-lg border ${config.bg} ${config.text} ${config.border}`}>
      {config.label}
    </span>
  );
}
