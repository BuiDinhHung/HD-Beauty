'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const base =
      'inline-flex items-center justify-center gap-2 font-semibold rounded-2xl transition-all duration-200 select-none focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none';

    const variants = {
      primary:
        'bg-gradient-primary text-white shadow-glass hover:shadow-glass-lg focus:ring-primary-400',
      secondary:
        'bg-secondary-300 text-primary-700 hover:bg-secondary-200 focus:ring-secondary',
      outline:
        'border-2 border-primary-400 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 focus:ring-primary-400',
      ghost:
        'text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20 focus:ring-primary-400',
      danger:
        'bg-red-500 text-white hover:bg-red-600 shadow-sm focus:ring-red-400',
      success:
        'bg-mint-400 text-emerald-900 hover:bg-mint-300 shadow-sm focus:ring-mint-400',
    };

    const sizes = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-11 px-5 text-sm',
      lg: 'h-13 px-7 text-base',
      icon: 'h-11 w-11',
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.96 }}
        className={cn(
          base,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || loading}
        {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
      >
        {loading ? (
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
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
