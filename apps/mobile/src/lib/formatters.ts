/**
 * Shared formatting utilities for TalepSat mobile
 */

/**
 * Format a number as Turkish Lira price string.
 * e.g. 300000 -> "₺300.000"
 */
export function formatPrice(amount: number): string {
  return '₺' + amount.toLocaleString('tr-TR', { maximumFractionDigits: 0 });
}

/**
 * Map deliveryUrgency slug to a human-readable Turkish label.
 */
const urgencyMap: Record<string, string> = {
  urgent: 'Acil',
  normal: 'Normal',
  flexible: 'Esnek',
};

export function urgencyLabel(slug: string): string {
  return urgencyMap[slug] ?? slug;
}

/**
 * Calculate the number of days remaining until the given expiry date.
 * Returns null if expiresAt is null or already expired.
 */
export function daysRemaining(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Relative time label (e.g. "2 saat önce", "3 gün önce")
 */
export function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'az önce';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} gün önce`;
  const months = Math.floor(days / 30);
  return `${months} ay önce`;
}
