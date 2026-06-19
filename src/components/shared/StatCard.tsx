'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: { value: number; label: string };
  gradient?: string;
  className?: string;
  delay?: number;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  gradient,
  className,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'rounded-3xl p-5 relative overflow-hidden',
        gradient
          ? `${gradient} text-white`
          : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-card',
        className
      )}
    >
      {gradient && (
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/30" />
          <div className="absolute -right-8 -bottom-4 h-32 w-32 rounded-full bg-white/20" />
        </div>
      )}
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <p
            className={cn(
              'text-sm font-medium',
              gradient ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {title}
          </p>
          {icon && (
            <div
              className={cn(
                'p-2 rounded-xl',
                gradient ? 'bg-white/20' : 'bg-primary-50 dark:bg-primary-900/20 text-primary-500'
              )}
            >
              {icon}
            </div>
          )}
        </div>
        <p
          className={cn(
            'text-2xl font-bold',
            gradient ? 'text-white' : 'text-gray-900 dark:text-gray-100'
          )}
        >
          {value}
        </p>
        {subtitle && (
          <p
            className={cn(
              'text-xs mt-1',
              gradient ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'
            )}
          >
            {subtitle}
          </p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <span
              className={cn(
                'text-xs font-semibold',
                trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'
              )}
            >
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
            <span className={cn('text-xs', gradient ? 'text-white/60' : 'text-gray-400')}>
              {trend.label}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
