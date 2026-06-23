'use client';

import { useState, useMemo } from 'react';
import { ArrowLeftRight, Filter } from 'lucide-react';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeTransactions } from '@/hooks/useTransactions';
import { useStaff } from '@/hooks/useStaff';
import { deleteTransaction } from '@/services/transaction.service';
import Header from '@/components/layout/Header';
import SearchBar from '@/components/ui/SearchBar';
import TransactionCard from '@/components/shared/TransactionCard';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { SkeletonList } from '@/components/ui/Loading';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatCurrency, exportToExcel, exportToPDF } from '@/lib/utils';
import { Transaction } from '@/types';

type FilterMode = 'all' | 'month' | 'week' | 'custom';

export default function TransactionsPage() {
  const { user } = useAuth();
  const { transactions, loading } = useRealtimeTransactions(user?.shopId);
  const { staff } = useStaff(user?.shopId);
  const [search, setSearch] = useState('');
  const [staffFilter, setStaffFilter] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [customFrom, setCustomFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [customTo, setCustomTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showFilters, setShowFilters] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  const staffNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    staff.forEach((s) => { map[s.id] = s.name; });
    return map;
  }, [staff]);

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

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch =
        !search ||
        t.customerName.toLowerCase().includes(search.toLowerCase()) ||
        t.staffName.toLowerCase().includes(search.toLowerCase()) ||
        t.serviceNames.some((s) => s.toLowerCase().includes(search.toLowerCase()));

      const matchStaff = !staffFilter || t.staffId === staffFilter;

      let matchDate = true;
      if (dateFrom && dateTo) {
        const txDate = t.createdAt.toDate();
        matchDate = txDate >= dateFrom && txDate <= dateTo;
      }

      return matchSearch && matchStaff && matchDate;
    });
  }, [transactions, search, staffFilter, dateFrom, dateTo]);

  const totalAmount = filtered.reduce((s, t) => s + t.totalAmount, 0);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTransaction(deleteTarget.id);
      toast.success('Đã xóa giao dịch');
      setDeleteTarget(null);
    } catch {
      toast.error('Không thể xóa');
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStaffFilter('');
    setFilterMode('all');
  };

  const staffSuffix = staffFilter
    ? `-${(staffNameMap[staffFilter] ?? staffFilter).replace(/\s+/g, '-')}`
    : '';
  const exportFilename = `giao-dich-${rangeFilename}${staffSuffix}`;
  const exportTitle = `Giao dịch – ${rangeLabel}${staffFilter ? ` · ${staffNameMap[staffFilter] ?? ''}` : ''}`;

  const handleExportExcel = () => {
    exportToExcel(
      filtered.map((t) => ({
        'Ngày': format(t.createdAt.toDate(), 'dd/MM/yyyy HH:mm'),
        'Khách hàng': t.customerName,
        'SĐT': t.customerPhone,
        'Nhân viên': t.staffName,
        'Dịch vụ': t.serviceNames.join(', '),
        'Số tiền (€)': t.totalAmount,
      })),
      exportFilename
    );
  };

  const handleExportPDF = () => {
    exportToPDF(
      exportTitle,
      ['Ngày', 'Khách hàng', 'SĐT', 'Nhân viên', 'Dịch vụ', 'Số tiền'],
      filtered.map((t) => [
        format(t.createdAt.toDate(), 'dd/MM/yyyy'),
        t.customerName,
        t.customerPhone,
        t.staffName,
        t.serviceNames.join(', '),
        formatCurrency(t.totalAmount),
      ]),
      exportFilename
    );
  };

  const activeFilterCount = [filterMode !== 'all', !!staffFilter].filter(Boolean).length;

  return (
    <div>
      <Header
        title="Giao dịch"
        subtitle={`${filtered.length} giao dịch`}
        rightAction={
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative p-2 rounded-xl transition-colors ${
              showFilters
                ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30'
                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Filter size={18} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary-600 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        }
      />

      <div className="p-4 md:p-6 space-y-4 max-w-5xl">
        <SearchBar
          placeholder="Tìm khách, nhân viên, dịch vụ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
        />

        {/* Quick filter pills — always visible */}
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

        {/* Custom date range — only when Tùy chọn selected */}
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

        {/* Staff filter + export — collapsible */}
        {showFilters && (
          <Card padding="sm">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Nhân viên</label>
              <select
                className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
              >
                <option value="">Tất cả nhân viên</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </Card>
        )}

        {/* Export buttons — always visible */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportExcel} className="flex-1">
            <Image src="/export excel.png" alt="Excel" width={16} height={16} /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="flex-1">
            <Image src="/export pdf.png" alt="PDF" width={16} height={16} /> PDF
          </Button>
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-xs text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors"
          >
            Xóa lọc
          </button>
        </div>

        {filtered.length > 0 && (
          <div className="bg-gradient-primary rounded-2xl p-4 text-white">
            <p className="text-sm text-white/80">Tổng doanh thu</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalAmount)}</p>
            <p className="text-xs text-white/60 mt-1">{filtered.length} giao dịch</p>
          </div>
        )}

        {loading ? (
          <SkeletonList count={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<ArrowLeftRight size={36} />}
            title="Không có giao dịch"
            description="Chưa có giao dịch nào trong khoảng thời gian này"
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((t, i) => (
              <TransactionCard
                key={t.id}
                transaction={t}
                index={i}
                onDelete={() => setDeleteTarget(t)}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xóa giao dịch"
        description="Bạn có chắc muốn xóa giao dịch này không?"
        confirmLabel="Xóa"
        loading={deleting}
      />
    </div>
  );
}
