'use client';

import { useEffect, useState } from 'react';
import { Service } from '@/types';
import { subscribeServices } from '@/services/service.service';

export function useServices(shopId: string | undefined) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shopId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeServices(
      shopId,
      (data) => { setServices(data); setLoading(false); },
      ()    => { setLoading(false); },
    );
    return unsub;
  }, [shopId]);

  const activeServices = services.filter((s) => s.active);

  return { services, activeServices, loading };
}
