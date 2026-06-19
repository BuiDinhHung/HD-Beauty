'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';

const navItems = [
  { href: '/staff/home',    img: '/dashboard.png',          label: 'Trang chủ' },
  { href: '/staff/new',     img: '/nhap doanh thu.png',     label: 'Thêm GD',  isAdd: true },
  { href: '/staff/history', img: '/lich su.png',            label: 'Lịch sử'  },
];

export default function StaffBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 min-w-0 flex-1"
            >
              {item.isAdd ? (
                <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center shadow-glass -mt-4">
                  <Image src={item.img} alt={item.label} width={28} height={28} />
                </div>
              ) : (
                <div className="relative">
                  {active && (
                    <motion.div
                      layoutId="staff-nav-indicator"
                      className="absolute inset-0 rounded-xl bg-primary-100 dark:bg-primary-900/30"
                      style={{ margin: '-4px' }}
                    />
                  )}
                  <Image
                    src={item.img}
                    alt={item.label}
                    width={24}
                    height={24}
                    className={cn(
                      'relative transition-opacity duration-200',
                      active ? 'opacity-100' : 'opacity-45'
                    )}
                  />
                </div>
              )}
              <span
                className={cn(
                  'text-[10px] font-medium leading-none transition-colors duration-200 truncate',
                  item.isAdd
                    ? 'text-primary-600 dark:text-primary-400'
                    : active
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-400 dark:text-gray-500'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Profile — không có ảnh phù hợp, dùng lucide */}
        {(() => {
          const active = pathname === '/staff/profile';
          return (
            <Link href="/staff/profile" className="flex flex-col items-center gap-1 min-w-0 flex-1">
              <div className="relative">
                {active && (
                  <motion.div
                    layoutId="staff-nav-indicator"
                    className="absolute inset-0 rounded-xl bg-primary-100 dark:bg-primary-900/30"
                    style={{ margin: '-4px' }}
                  />
                )}
                <User
                  size={22}
                  className={cn(
                    'relative transition-colors duration-200',
                    active ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
                  )}
                />
              </div>
              <span className={cn(
                'text-[10px] font-medium leading-none truncate',
                active ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
              )}>
                Hồ sơ
              </span>
            </Link>
          );
        })()}
      </div>
    </nav>
  );
}
