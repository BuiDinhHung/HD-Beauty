'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Loading from '@/components/ui/Loading';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else if (user.role === 'super_admin') {
      router.replace('/super-admin/dashboard');
    } else if (user.role === 'owner' || user.role === 'manager') {
      router.replace('/owner/dashboard');
    } else {
      router.replace('/staff/home');
    }
  }, [user, loading, router]);

  return <Loading fullScreen text="Đang tải HD Beauty..." />;
}
