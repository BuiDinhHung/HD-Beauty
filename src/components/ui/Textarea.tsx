'use client';

import { TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={3}
          className={cn(
            'w-full px-4 py-3 rounded-2xl border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100',
            'placeholder:text-gray-400 resize-none',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent',
            'disabled:opacity-50',
            error ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 dark:border-gray-700',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;
