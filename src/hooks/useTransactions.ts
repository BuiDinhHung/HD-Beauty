'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { Transaction } from '@/types';
import {
  subscribeTransactions,
  subscribeStaffTransactions,
} from '@/services/transaction.service';
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  subDays,
  format,
} from 'date-fns';

const LOADING_TIMEOUT_MS = 4000; // 4 giây tối đa

export function useRealtimeTransactions(shopId: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!shopId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Timeout fallback — tắt skeleton sau LOADING_TIMEOUT_MS
    timerRef.current = setTimeout(() => setLoading(false), LOADING_TIMEOUT_MS);

    const unsub = subscribeTransactions(shopId, (data) => {
      setTransactions(data);
      setLoading(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    });

    return () => {
      unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [shopId]);

  return { transactions, loading };
}

export function useStaffTransactions(shopId: string | undefined, staffId: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!shopId || !staffId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    timerRef.current = setTimeout(() => setLoading(false), LOADING_TIMEOUT_MS);

    const unsub = subscribeStaffTransactions(shopId, staffId, (data) => {
      setTransactions(data);
      setLoading(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    });

    return () => {
      unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [shopId, staffId]);

  return { transactions, loading };
}

export function useDashboardStats(transactions: Transaction[]) {
  return useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const todayTx = transactions.filter((t) => {
      const d = t.createdAt.toDate();
      return d >= todayStart && d <= todayEnd;
    });

    const monthTx = transactions.filter((t) => {
      const d = t.createdAt.toDate();
      return d >= monthStart && d <= monthEnd;
    });

    const todayRevenue = todayTx.reduce((s, t) => s + t.totalAmount, 0);
    const monthRevenue = monthTx.reduce((s, t) => s + t.totalAmount, 0);

    const staffRevenue: Record<string, { name: string; revenue: number; count: number }> = {};

    monthTx.forEach((t) => {
      if (!staffRevenue[t.staffId]) {
        staffRevenue[t.staffId] = { name: t.staffName, revenue: 0, count: 0 };
      }
      staffRevenue[t.staffId].revenue += t.totalAmount;
      staffRevenue[t.staffId].count += 1;
    });

    const topStaff = Object.entries(staffRevenue)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([id, v]) => ({
        staffId: id,
        staffName: v.name,
        totalRevenue: v.revenue,
        customerCount: v.count,
        avgRevenue: v.count > 0 ? v.revenue / v.count : 0,
      }));

    return {
      todayRevenue,
      monthRevenue,
      todayCustomers: todayTx.length,
      monthCustomers: monthTx.length,
      topStaff,
    };
  }, [transactions]);
}

export function useChartData(transactions: Transaction[], days = 30) {
  return useMemo(() => {
    const now = new Date();
    return Array.from({ length: days }, (_, i) => {
      const d = subDays(now, days - 1 - i);
      const dayStart = startOfDay(d);
      const dayEnd = endOfDay(d);
      const dayTx = transactions.filter((t) => {
        const td = t.createdAt.toDate();
        return td >= dayStart && td <= dayEnd;
      });
      return {
        date: format(d, 'dd/MM'),
        revenue: dayTx.reduce((s, t) => s + t.totalAmount, 0),
        customers: dayTx.length,
      };
    });
  }, [transactions, days]);
}
