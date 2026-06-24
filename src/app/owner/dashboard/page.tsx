'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Calendar,
} from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeTransactions, useDashboardStats, useChartData } from '@/hooks/useTransactions';
import Header from '@/components/layout/Header';
import StatCard from '@/components/shared/StatCard';
import Card from '@/components/ui/Card';
import RevenueChart from '@/components/charts/RevenueChart';
import StaffBarChart from '@/components/charts/StaffBarChart';
import { SkeletonCard } from '@/components/ui/Loading';
import { formatCurrency, formatDate } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function OwnerDashboard() {
  const { user, shop } = useAuth();
  const { transactions, loading } = useRealtimeTransactions(user?.shopId);
  const stats = useDashboardStats(transactions);
  const chartData = useChartData(transactions, 30);
  const today = format(new Date(), "EEEE, dd 'tháng' MM", { locale: vi });

  return (
    <div>
      <Header
        title={shop?.name || 'HD Beauty'}
        subtitle={today}
        rightAction={
          <Image src="/logo.png" alt="HD Beauty" width={34} height={34} className="rounded-full" />
        }
      />

      <div className="p-4 md:p-6 space-y-5 max-w-6xl">
        {/* Stats Grid */}
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
                title="Khách tháng này"
                value={stats.monthCustomers}
                subtitle="lượt khách"
                icon={<Activity size={18} />}
                delay={0.15}
              />
            </>
          )}
        </div>

        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-gray-100">Doanh thu 30 ngày</h3>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Calendar size={12} />
                30 ngày qua
              </div>
            </div>
            <RevenueChart data={chartData} />
          </Card>
        </motion.div>

        {/* Top Staff */}
        {stats.topStaff.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">
                Top nhân viên tháng này
              </h3>
              <div className="space-y-3">
                {stats.topStaff.map((s, i) => (
                  <div key={s.staffId} className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                        i === 0
                          ? 'bg-gradient-to-br from-amber-400 to-orange-400'
                          : i === 1
                          ? 'bg-gradient-to-br from-gray-300 to-gray-400'
                          : i === 2
                          ? 'bg-gradient-to-br from-amber-600 to-amber-700'
                          : 'bg-gradient-primary'
                      }`}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                        {s.staffName}
                      </p>
                      <p className="text-xs text-gray-400">{s.customerCount} khách</p>
                    </div>
                    <p className="font-bold text-sm text-primary-600 dark:text-primary-400 flex-shrink-0">
                      {formatCurrency(s.totalRevenue)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <StaffBarChart data={stats.topStaff} />
              </div>
            </Card>
          </motion.div>
        )}

      </div>
    </div>
  );
}
