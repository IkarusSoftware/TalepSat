import { cn } from '../utils/cn';

export interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'primary' | 'accent' | 'silver' | 'gold' | 'platinum';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

const variantClasses = {
  default: 'bg-neutral-100 text-neutral-700 dark:bg-dark-surface dark:text-dark-textSecondary',
  success: 'bg-success-light text-success dark:bg-success/20 dark:text-green-400',
  warning: 'bg-warning-light text-warning dark:bg-warning/20 dark:text-amber-400',
  error: 'bg-error-light text-error dark:bg-error/20 dark:text-red-400',
  primary: 'bg-primary-lighter text-primary dark:bg-primary/20 dark:text-blue-300',
  accent: 'bg-accent-light text-accent dark:bg-accent/20 dark:text-orange-300',
  silver: 'bg-neutral-200 text-neutral-600 border border-neutral-300',
  gold: 'bg-amber-50 text-amber-700 border border-amber-300',
  platinum: 'bg-purple-50 text-purple-700 border border-purple-300',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-body-sm',
};

export function Badge({ variant = 'default', size = 'sm', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-sm whitespace-nowrap',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
}
