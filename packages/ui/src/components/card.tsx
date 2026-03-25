import { cn } from '../utils/cn';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: 'div' | 'article' | 'section';
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  children,
  className,
  hover = false,
  padding = 'md',
  as: Component = 'div',
}: CardProps) {
  return (
    <Component
      className={cn(
        'rounded-lg border border-neutral-200 bg-white',
        'dark:bg-dark-surface dark:border-dark-border',
        'shadow-sm',
        hover && [
          'transition-all duration-normal cursor-pointer',
          'hover:shadow-md hover:scale-[1.01]',
          'hover:border-neutral-300 dark:hover:border-neutral-600',
        ],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </Component>
  );
}
