'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import StaffBottomNav from '@/components/layout/StaffBottomNav';
import StaffSidebar from '@/components/layout/StaffSidebar';
import Loading from '@/components/ui/Loading';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/login');
      else if (user.role === 'owner') router.replace('/owner/dashboard');
      else if (!user.shopId) router.replace('/setup');
      else if (!user.active) router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) return <Loading fullScreen text="Đang tải..." />;
  if (!user || user.role !== 'staff') return null;

  return (
    <div className="min-h-screen min-h-dvh bg-gray-50 dark:bg-gray-950">
      <StaffSidebar />
      <main className="max-w-lg mx-auto md:max-w-none md:mx-0 md:ml-16 lg:ml-56 page-content md:pb-6">
        {children}
      </main>
      <StaffBottomNav />
    </div>
  );
}
