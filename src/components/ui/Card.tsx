'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ glass = false, hover = false, padding = 'md', className, children, ...props }, ref) => {
    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-5',
      lg: 'p-6',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-3xl transition-all duration-200',
          glass
            ? 'bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-glass'
            : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-card',
          hover && 'hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer',
          paddings[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
export default Card;
