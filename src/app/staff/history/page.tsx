'use client';

import { useState } from 'react';
import { History } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useStaffTransactions } from '@/hooks/useTransactions';
import Header from '@/components/layout/Header';
import TransactionCard from '@/components/shared/TransactionCard';
import SearchBar from '@/components/ui/SearchBar';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/Loading';
import { formatCurrency } from '@/lib/utils';
import { startOfDay, endOfDay } from 'date-fns';

export default function StaffHistoryPage() {
  const { user } = useAuth();
  const { transactions, loading } = useStaffTransactions(user?.shopId, user?.id);
  const [search, setSearch] = useState('');

  const todayRevenue = transactions
    .filter((t) => {
      const d = t.createdAt.toDate();
      return d >= startOfDay(new Date()) && d <= endOfDay(new Date());
    })
    .reduce((s, t) => s + t.totalAmount, 0);

  const filtered = transactions.filter(
    (t) =>
      !search ||
      t.customerName.toLowerCase().includes(search.toLowerCase()) ||
      t.serviceNames.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <Header title="Lịch sử" subtitle={`${transactions.length} giao dịch`} />

      <div className="p-4 md:p-6 space-y-4 max-w-5xl">
        {transactions.length > 0 && (
          <div className="bg-gradient-primary rounded-2xl p-4 text-white">
            <p className="text-sm text-white/80">Doanh thu hôm nay của bạn</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(todayRevenue)}</p>
          </div>
        )}

        <SearchBar
          placeholder="Tìm theo tên khách, dịch vụ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
        />

        {loading ? (
          <SkeletonList count={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<History size={36} />}
            title={search ? 'Không tìm thấy' : 'Chưa có giao dịch'}
            description={search ? 'Thử tìm kiếm khác' : 'Các giao dịch bạn tạo sẽ hiển thị tại đây'}
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

