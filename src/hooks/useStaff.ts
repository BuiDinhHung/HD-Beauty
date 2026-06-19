'use client';

import { useEffect, useState } from 'react';
import { User } from '@/types';
import { subscribeStaffList } from '@/services/staff.service';

export function useStaff(shopId: string | undefined) {
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shopId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeStaffList(
      shopId,
      (data) => { setStaff(data); setLoading(false); },
      ()    => { setLoading(false); },
    );
    return unsub;
  }, [shopId]);

  const activeStaff = staff.filter((s) => s.active);

  return { staff, activeStaff, loading };
}
