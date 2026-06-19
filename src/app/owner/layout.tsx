'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import OwnerBottomNav from '@/components/layout/OwnerBottomNav';
import OwnerSidebar from '@/components/layout/OwnerSidebar';
import Loading from '@/components/ui/Loading';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/login');
      else if (user.role === 'super_admin') router.replace('/super-admin/dashboard');
      else if (user.role === 'staff') router.replace('/staff/home');
    }
  }, [user, loading, isAdmin, router]);

  if (loading) return <Loading fullScreen text="Đang tải..." />;
  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen min-h-dvh bg-gray-50 dark:bg-gray-950">
      <OwnerSidebar />
      {/* mobile: centered 512px | desktop: offset for sidebar, full width */}
      <main className="max-w-lg mx-auto md:max-w-none md:mx-0 md:ml-16 lg:ml-56 page-content md:pb-6">
        {children}
      </main>
      <OwnerBottomNav />
    </div>
  );
}
