import { cn } from '../utils/cn';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, variant = 'rectangular', width, height }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-neutral-200 dark:bg-dark-surfaceRaised',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'rounded-sm h-4',
        variant === 'rectangular' && 'rounded-lg',
        className
      )}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface p-6 space-y-4">
      <Skeleton className="h-4 w-16" variant="text" />
      <Skeleton className="h-5 w-3/4" variant="text" />
      <Skeleton className="h-4 w-full" variant="text" />
      <Skeleton className="h-4 w-2/3" variant="text" />
      <div className="flex items-center gap-3 pt-2">
        <Skeleton className="h-8 w-8" variant="circular" />
        <Skeleton className="h-4 w-24" variant="text" />
      </div>
    </div>
  );
}
