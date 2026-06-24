'use client';

import { useState, useMemo } from 'react';
import { History } from 'lucide-react';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useStaffTransactions } from '@/hooks/useTransactions';
import Header from '@/components/layout/Header';
import TransactionCard from '@/components/shared/TransactionCard';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/Loading';
import Button from '@/components/ui/Button';
import { formatCurrency, exportToExcel, exportToPDF } from '@/lib/utils';

type FilterMode = 'all' | 'month' | 'week' | 'custom';

export default function StaffHistoryPage() {
  const { user } = useAuth();
  const { transactions, loading } = useStaffTransactions(user?.shopId, user?.id);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [customFrom, setCustomFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [customTo, setCustomTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { dateFrom, dateTo, rangeLabel, rangeFilename } = useMemo(() => {
    const today = new Date();
    if (filterMode === 'month') {
      return {
        dateFrom: startOfMonth(today),
        dateTo: endOfMonth(today),
        rangeLabel: format(today, 'MMMM yyyy', { locale: vi }),
        rangeFilename: format(today, 'yyyy-MM'),
      };
    }
    if (filterMode === 'week') {
      const from = startOfDay(subDays(today, 6));
      return {
        dateFrom: from,
        dateTo: endOfDay(today),
        rangeLabel: `${format(from, 'dd/MM')} – ${format(today, 'dd/MM/yyyy')}`,
        rangeFilename: `7ngay-${format(today, 'yyyyMMdd')}`,
      };
    }
    if (filterMode === 'custom') {
      const from = startOfDay(parseISO(customFrom));
      const to = endOfDay(parseISO(customTo));
      return {
        dateFrom: from,
        dateTo: to,
        rangeLabel: `${format(from, 'dd/MM/yyyy')} – ${format(to, 'dd/MM/yyyy')}`,
        rangeFilename: `${format(from, 'yyyyMMdd')}-${format(to, 'yyyyMMdd')}`,
      };
    }
    return { dateFrom: null, dateTo: null, rangeLabel: 'Tất cả', rangeFilename: 'tat-ca' };
  }, [filterMode, customFrom, customTo]);

  const todayRevenue = useMemo(() =>
    transactions
      .filter((t) => {
        const d = t.createdAt.toDate();
        return d >= startOfDay(new Date()) && d <= endOfDay(new Date());
      })
      .reduce((s, t) => s + t.totalAmount, 0),
    [transactions]
  );

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      let matchDate = true;
      if (dateFrom && dateTo) {
        const d = t.createdAt.toDate();
        matchDate = d >= dateFrom && d <= dateTo;
      }
      return matchDate;
    });
  }, [transactions, dateFrom, dateTo]);

  const totalFiltered = filtered.reduce((s, t) => s + t.totalAmount, 0);

  const exportFilename = `lich-su-giao-dich-${rangeFilename}`;
  const exportTitle = `Lịch sử giao dịch – ${rangeLabel}`;

  const handleExportExcel = () => {
    exportToExcel(
      filtered.map((t) => ({
        'Ngày': format(t.createdAt.toDate(), 'dd/MM/yyyy HH:mm'),
        'Số tiền (€)': t.totalAmount,
      })),
      exportFilename
    );
  };

  const handleExportPDF = () => {
    exportToPDF(
      exportTitle,
      ['Ngày', 'Số tiền'],
      filtered.map((t) => [
        format(t.createdAt.toDate(), 'dd/MM/yyyy'),
        formatCurrency(t.totalAmount),
      ]),
      exportFilename
    );
  };

  return (
    <div>
      <Header title="Lịch sử" subtitle={`${filtered.length} giao dịch`} />

      <div className="p-4 md:p-6 space-y-4 max-w-5xl">
        {transactions.length > 0 && (
          <div className="bg-gradient-primary rounded-2xl p-4 text-white">
            <p className="text-sm text-white/80">Doanh thu hôm nay của bạn</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(todayRevenue)}</p>
          </div>
        )}

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1">
          {([
            { value: 'all', label: 'Tất cả' },
            { value: 'month', label: 'Tháng này' },
            { value: 'week', label: '7 ngày gần nhất' },
            { value: 'custom', label: 'Tùy chọn' },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterMode(opt.value)}
              className={`flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-xs font-medium transition-all ${
                filterMode === opt.value
                  ? 'bg-gradient-primary text-white shadow-glass'
                  : 'bg-white dark:bg-gray-900 text-gray-500 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Custom date range */}
        {filterMode === 'custom' && (
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Từ ngày</label>
              <input
                type="date"
                value={customFrom}
                max={customTo}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <span className="text-gray-400 pb-2">→</span>
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Đến ngày</label>
              <input
                type="date"
                value={customTo}
                min={customFrom}
                max={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          </div>
        )}

        {/* Export */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportExcel} className="flex-1">
            <Image src="/export excel.png" alt="Excel" width={16} height={16} /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="flex-1">
            <Image src="/export pdf.png" alt="PDF" width={16} height={16} /> PDF
          </Button>
        </div>

        {filterMode !== 'all' && filtered.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-3 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <p className="text-xs text-gray-500">{rangeLabel} · {filtered.length} GD</p>
            <p className="font-bold text-primary-600 text-sm">{formatCurrency(totalFiltered)}</p>
          </div>
        )}

        {loading ? (
          <SkeletonList count={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<History size={36} />}
            title="Chưa có giao dịch"
            description="Các giao dịch bạn tạo sẽ hiển thị tại đây"
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((t, i) => (
              <TransactionCard key={t.id} transaction={t} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
