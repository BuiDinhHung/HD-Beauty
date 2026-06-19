'use client';

import { useState, useMemo } from 'react';
import { ArrowLeftRight, Filter } from 'lucide-react';
import { startOfDay, endOfDay, format, parseISO, isWithinInterval } from 'date-fns';
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
import { formatCurrency } from '@/lib/utils';
import { Transaction } from '@/types';

export default function TransactionsPage() {
  const { user } = useAuth();
  const { transactions, loading } = useRealtimeTransactions(user?.shopId);
  const { staff } = useStaff(user?.shopId);
  const [search, setSearch] = useState('');
  const [staffFilter, setStaffFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch =
        !search ||
        t.customerName.toLowerCase().includes(search.toLowerCase()) ||
        t.staffName.toLowerCase().includes(search.toLowerCase()) ||
        t.serviceNames.some((s) => s.toLowerCase().includes(search.toLowerCase()));

      const matchStaff = !staffFilter || t.staffId === staffFilter;

      let matchDate = true;
      if (dateFrom) {
        const from = startOfDay(parseISO(dateFrom));
        const to = dateTo ? endOfDay(parseISO(dateTo)) : endOfDay(new Date());
        const txDate = t.createdAt.toDate();
        matchDate = txDate >= from && txDate <= to;
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
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div>
      <Header
        title="Giao dịch"
        subtitle={`${filtered.length} giao dịch`}
        rightAction={
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-xl transition-colors ${
              showFilters
                ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30'
                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Filter size={18} />
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

        {showFilters && (
          <Card padding="sm">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Nhân viên</label>
                <select
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  value={staffFilter}
                  onChange={(e) => setStaffFilter(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Từ ngày</label>
                  <input
                    type="date"
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Đến ngày</label>
                  <input
                    type="date"
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
              <button
                onClick={clearFilters}
                className="text-xs text-primary-600 dark:text-primary-400 font-medium"
              >
                Xóa bộ lọc
              </button>
            </div>
          </Card>
        )}

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

