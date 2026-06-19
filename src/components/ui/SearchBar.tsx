'use client';

import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InputHTMLAttributes } from 'react';

interface SearchBarProps extends InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onClear?: () => void;
}

export default function SearchBar({ value, onClear, className, ...props }: SearchBarProps) {
  return (
    <div className="relative">
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        value={value}
        className={cn(
          'w-full h-11 pl-9 pr-9 rounded-2xl border border-gray-200 dark:border-gray-700',
          'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm',
          'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400',
          'focus:border-transparent transition-all duration-200',
          className
        )}
        {...props}
      />
      {value && onClear && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
