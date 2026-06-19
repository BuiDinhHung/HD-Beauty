'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Loading from '@/components/ui/Loading';
import { Moon, Sun, LogOut, LayoutDashboard, Users } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from '@/contexts/ThemeContext';

const NAV = [
  { href: '/super-admin/dashboard', label: 'Tổng quan',    icon: LayoutDashboard },
  { href: '/super-admin/users',     label: 'Người dùng',   icon: Users },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isSuperAdmin, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/login');
      else if (!isSuperAdmin) router.replace('/');
    }
  }, [user, loading, isSuperAdmin, router]);

  if (loading) return <Loading fullScreen text="Đang tải..." />;
  if (!isSuperAdmin) return null;

  return (
    <div className="min-h-screen min-h-dvh bg-gray-50 dark:bg-gray-950">
      {/* Top nav */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="HD Beauty" width={36} height={36} className="rounded-xl flex-shrink-0" />
            <div className="hidden sm:block">
              <p className="font-bold text-sm text-gray-900 dark:text-gray-100 leading-none">HD Beauty</p>
              <p className="text-[10px] text-amber-500 font-medium">Super Admin</p>
            </div>

            {/* Nav tabs */}
            <nav className="flex items-center gap-1 ml-4">
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon size={14} />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={logout}
              className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 pb-10">{children}</main>
    </div>
  );
}
