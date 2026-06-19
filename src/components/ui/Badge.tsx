import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'gray';
  size?: 'sm' | 'md';
  children: ReactNode;
  className?: string;
}

export default function Badge({ variant = 'primary', size = 'sm', children, className }: BadgeProps) {
  const variants = {
    primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
    success: 'bg-mint-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    gray: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}
