'use client';

import { motion } from 'framer-motion';
import { DollarSign, Users, TrendingUp, PlusCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useStaffTransactions, useDashboardStats } from '@/hooks/useTransactions';
import Header from '@/components/layout/Header';
import StatCard from '@/components/shared/StatCard';
import TransactionCard from '@/components/shared/TransactionCard';
import Button from '@/components/ui/Button';
import { SkeletonCard, SkeletonList } from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function StaffHomePage() {
  const { user, shop } = useAuth();
  const { transactions, loading } = useStaffTransactions(user?.shopId, user?.id);
  const stats = useDashboardStats(transactions);
  const greeting = format(new Date(), "EEEE, dd 'tháng' MM", { locale: vi });

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div>
      <Header
        title={`Xin chào, ${user?.name?.split(' ').pop() || 'bạn'}!`}
        subtitle={greeting}
        rightAction={
          <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
        }
      />

      <div className="p-4 md:p-6 space-y-5 max-w-4xl">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {loading ? (
            <>
              <SkeletonCard className="h-28" />
              <SkeletonCard className="h-28" />
              <SkeletonCard className="h-28" />
              <SkeletonCard className="h-28" />
            </>
          ) : (
            <>
              <StatCard
                title="Doanh thu hôm nay"
                value={formatCurrency(stats.todayRevenue)}
                icon={<DollarSign size={18} />}
                gradient="bg-gradient-to-br from-primary-500 to-secondary-400"
                delay={0}
              />
              <StatCard
                title="Doanh thu tháng"
                value={formatCurrency(stats.monthRevenue)}
                icon={<TrendingUp size={18} />}
                gradient="bg-gradient-to-br from-mint-400 to-emerald-400"
                delay={0.05}
              />
              <StatCard
                title="Khách hôm nay"
                value={stats.todayCustomers}
                subtitle="lượt khách"
                icon={<Users size={18} />}
                delay={0.1}
              />
              <StatCard
                title="Khách tháng"
                value={stats.monthCustomers}
                subtitle="lượt khách"
                delay={0.15}
              />
            </>
          )}
        </div>

        {/* Quick Add */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link href="/staff/new">
            <div className="bg-gradient-primary rounded-3xl p-5 text-white shadow-glass-lg flex items-center gap-4 active:scale-95 transition-transform">
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <PlusCircle size={24} />
              </div>
              <div>
                <p className="font-bold text-lg">Nhập giao dịch mới</p>
                <p className="text-white/70 text-sm">Thêm doanh thu ngay</p>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 dark:text-gray-100">Giao dịch gần đây</h3>
            <Link href="/staff/history" className="text-sm text-primary-600 dark:text-primary-400 font-medium">
              Xem tất cả
            </Link>
          </div>

          {loading ? (
            <SkeletonList count={3} />
          ) : recentTransactions.length === 0 ? (
            <EmptyState
              title="Chưa có giao dịch"
              description="Bắt đầu nhập giao dịch đầu tiên của bạn!"
              action={
                <Link href="/staff/new">
                  <Button><PlusCircle size={16} /> Thêm ngay</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((t, i) => (
                <TransactionCard key={t.id} transaction={t} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
