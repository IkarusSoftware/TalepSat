import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  pill?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantClasses = {
  primary:
    'bg-accent text-white hover:bg-accent-600 active:bg-accent-700 shadow-sm hover:shadow-md',
  secondary:
    'border-2 border-primary text-primary hover:bg-primary hover:text-white',
  ghost:
    'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-dark-surface',
  destructive:
    'bg-error text-white hover:bg-error-dark',
};

const sizeClasses = {
  sm: 'h-8 px-3 text-body-sm gap-1.5',
  md: 'h-10 px-4 text-body-md gap-2',
  lg: 'h-12 px-6 text-body-lg gap-2',
  xl: 'h-14 px-8 text-body-lg font-semibold gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      pill = false,
      loading = false,
      disabled,
      icon,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base
          'inline-flex items-center justify-center font-medium',
          'transition-all duration-fast ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
          'hover:scale-[1.02] active:scale-[0.97]',
          'disabled:opacity-50 disabled:pointer-events-none',
          // Radius
          pill ? 'rounded-full' : 'rounded-md',
          // Variant
          variantClasses[variant],
          // Size
          sizeClasses[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {!loading && icon}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
