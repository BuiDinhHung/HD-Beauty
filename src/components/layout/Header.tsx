'use client';

import { ReactNode } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { motion } from 'framer-motion';

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: ReactNode;
  showThemeToggle?: boolean;
}

export default function Header({ title, subtitle, rightAction, showThemeToggle = true }: HeaderProps) {
  const { toggleTheme, isDark } = useTheme();

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 safe-area-top"
    >
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto md:max-w-none md:mx-0">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {rightAction}
          {showThemeToggle && (
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
