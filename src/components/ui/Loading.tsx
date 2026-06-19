import { cn } from '@/lib/utils';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <svg
      className={cn('animate-spin text-primary-400', sizes[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function Loading({ size = 'md', text, fullScreen = false }: LoadingProps) {
  const content = (
    <div className="flex flex-col items-center gap-3">
      <LoadingSpinner size={size} />
      {text && <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return <div className="flex items-center justify-center py-12">{content}</div>;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-3xl bg-gray-100 dark:bg-gray-800 animate-pulse', className)}>
      <div className="p-5 space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-2/3" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-1/2" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-full" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse">
          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-1/2" />
          </div>
          <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
      ))}
    </div>
  );
}
