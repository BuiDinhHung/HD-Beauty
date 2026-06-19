'use client';

import { useState, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import Image from 'next/image';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeTransactions } from '@/hooks/useTransactions';
import { useStaff } from '@/hooks/useStaff';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatCurrency, exportToExcel, exportToPDF, printReport } from '@/lib/utils';
import { StaffReport, ServiceReport } from '@/types';

export default function ReportsPage() {
  const { user } = useAuth();
  const { transactions } = useRealtimeTransactions(user?.shopId);
  const { staff } = useStaff(user?.shopId);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [activeTab, setActiveTab] = useState<'staff' | 'service'>('staff');

  // Map staffId → tên hiện tại để đồng bộ khi nhân viên đổi tên
  const staffNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    staff.forEach((s) => { map[s.id] = s.name; });
    return map;
  }, [staff]);

  const monthDate = parseISO(`${selectedMonth}-01`);
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const monthLabel = format(monthDate, 'MMMM yyyy', { locale: vi });

  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const d = t.createdAt.toDate();
      return d >= monthStart && d <= monthEnd;
    });
  }, [transactions, monthStart, monthEnd]);

  const staffReports = useMemo((): StaffReport[] => {
    const map: Record<string, StaffReport> = {};
    monthTransactions.forEach((t) => {
      if (!map[t.staffId]) {
        map[t.staffId] = {
          staffId: t.staffId,
          staffName: staffNameMap[t.staffId] ?? t.staffName,
          customerCount: 0,
          totalRevenue: 0,
          avgRevenue: 0,
        };
      }
      map[t.staffId].customerCount += 1;
      map[t.staffId].totalRevenue += t.totalAmount;
    });
    return Object.values(map)
      .map((r) => ({ ...r, avgRevenue: r.customerCount > 0 ? r.totalRevenue / r.customerCount : 0 }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [monthTransactions, staffNameMap]);

  const serviceReports = useMemo((): ServiceReport[] => {
    const map: Record<string, ServiceReport> = {};
    monthTransactions.forEach((t) => {
      t.serviceIds.forEach((sid, idx) => {
        if (!map[sid]) {
          map[sid] = {
            serviceId: sid,
            serviceName: t.serviceNames[idx] || sid,
            usageCount: 0,
            totalRevenue: 0,
          };
        }
        map[sid].usageCount += 1;
        map[sid].totalRevenue += t.totalAmount / t.serviceIds.length;
      });
    });
    return Object.values(map).sort((a, b) => b.usageCount - a.usageCount);
  }, [monthTransactions]);

  const totalRevenue = staffReports.reduce((s, r) => s + r.totalRevenue, 0);

  const handleExportExcel = () => {
    if (activeTab === 'staff') {
      exportToExcel(
        staffReports.map((r) => ({
          'Nhân viên': r.staffName,
          'Số khách': r.customerCount,
          'Doanh thu': r.totalRevenue,
          'Trung bình/khách': Math.round(r.avgRevenue),
        })),
        `bao-cao-nhan-vien-${selectedMonth}`
      );
    } else {
      exportToExcel(
        serviceReports.map((r) => ({
          'Dịch vụ': r.serviceName,
          'Số lượt': r.usageCount,
          'Doanh thu': Math.round(r.totalRevenue),
        })),
        `bao-cao-dich-vu-${selectedMonth}`
      );
    }
  };

  const handleExportPDF = () => {
    if (activeTab === 'staff') {
      exportToPDF(
        `Báo cáo nhân viên - ${monthLabel}`,
        ['Nhân viên', 'Số khách', 'Doanh thu', 'TB/khách'],
        staffReports.map((r) => [
          r.staffName,
          r.customerCount,
          formatCurrency(r.totalRevenue),
          formatCurrency(r.avgRevenue),
        ]),
        `bao-cao-nhan-vien-${selectedMonth}`
      );
    } else {
      exportToPDF(
        `Báo cáo dịch vụ - ${monthLabel}`,
        ['Dịch vụ', 'Số lượt', 'Doanh thu'],
        serviceReports.map((r) => [
          r.serviceName,
          r.usageCount,
          formatCurrency(r.totalRevenue),
        ]),
        `bao-cao-dich-vu-${selectedMonth}`
      );
    }
  };

  const handlePrint = () => {
    if (activeTab === 'staff') {
      printReport(
        `Báo cáo nhân viên - ${monthLabel}`,
        ['Nhân viên', 'Số khách', 'Doanh thu', 'TB/khách'],
        staffReports.map((r) => [
          r.staffName,
          r.customerCount,
          formatCurrency(r.totalRevenue),
          formatCurrency(r.avgRevenue),
        ]),
        `bao-cao-nhan-vien-${selectedMonth}`
      );
    } else {
      printReport(
        `Báo cáo dịch vụ - ${monthLabel}`,
        ['Dịch vụ', 'Số lượt', 'Doanh thu'],
        serviceReports.map((r) => [
          r.serviceName,
          r.usageCount,
          formatCurrency(r.totalRevenue),
        ]),
        `bao-cao-dich-vu-${selectedMonth}`
      );
    }
  };

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), i);
    return { value: format(d, 'yyyy-MM'), label: format(d, 'MM/yyyy') };
  });

  return (
    <div>
      <Header title="Báo cáo" subtitle={monthLabel} />

      <div className="p-4 md:p-6 space-y-4 max-w-5xl">
        {/* Month Picker */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {months.map((m) => (
            <button
              key={m.value}
              onClick={() => setSelectedMonth(m.value)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedMonth === m.value
                  ? 'bg-gradient-primary text-white shadow-glass'
                  : 'bg-white dark:bg-gray-900 text-gray-500 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <Card padding="sm" className="text-center">
            <p className="text-xs text-gray-400 mb-1">Tổng DT</p>
            <p className="font-bold text-primary-600 text-xs sm:text-sm truncate">{formatCurrency(totalRevenue)}</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-xs text-gray-400 mb-1">Giao dịch</p>
            <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{monthTransactions.length}</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-xs text-gray-400 mb-1">NV</p>
            <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{staffReports.length}</p>
          </Card>
        </div>

        {/* Export Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportExcel} className="flex-1">
            <Image src="/export excel.png" alt="Excel" width={16} height={16} /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="flex-1">
            <Image src="/export pdf.png" alt="PDF" width={16} height={16} /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="flex-1">
            <Image src="/in.png" alt="In" width={16} height={16} /> In
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex rounded-2xl bg-gray-100 dark:bg-gray-800 p-1">
          {(['staff', 'service'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all ${
                activeTab === tab
                  ? 'bg-white dark:bg-gray-900 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              {tab === 'staff' ? 'Nhân viên' : 'Dịch vụ'}
            </button>
          ))}
        </div>

        {/* Staff Report */}
        {activeTab === 'staff' && (
          <Card>
            {staffReports.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Không có dữ liệu</p>
            ) : (
              <div className="space-y-4">
                {staffReports.map((r, i) => (
                  <div key={r.staffId}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{r.staffName}</p>
                        <p className="text-xs text-gray-400">{r.customerCount} khách · TB: {formatCurrency(r.avgRevenue)}</p>
                      </div>
                      <p className="font-bold text-primary-600 dark:text-primary-400 text-sm">{formatCurrency(r.totalRevenue)}</p>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden ml-11">
                      <div
                        className="h-full rounded-full bg-gradient-primary transition-all"
                        style={{ width: `${totalRevenue > 0 ? (r.totalRevenue / totalRevenue) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Service Report */}
        {activeTab === 'service' && (
          <Card>
            {serviceReports.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Không có dữ liệu</p>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {serviceReports.map((r, i) => (
                  <div key={r.serviceId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="text-sm text-gray-400 w-5 text-center">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{r.serviceName}</p>
                      <p className="text-xs text-gray-400">{r.usageCount} lượt sử dụng</p>
                    </div>
                    <p className="font-semibold text-sm text-primary-600 dark:text-primary-400 flex-shrink-0">
                      {formatCurrency(r.totalRevenue)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

