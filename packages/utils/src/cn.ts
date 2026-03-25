import type { ClassValue } from 'clsx';

/**
 * Utility for merging Tailwind CSS classes with clsx + tailwind-merge.
 * Note: clsx and tailwind-merge are peer dependencies — installed in consuming apps.
 */
export function cn(...inputs: ClassValue[]): string {
  // Dynamic imports avoided for performance — consumers should install clsx + tailwind-merge
  // This is re-exported with proper implementation in the UI package
  return inputs.filter(Boolean).join(' ');
}
