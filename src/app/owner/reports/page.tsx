'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { format, startOfMonth, endOfMonth, subDays, parseISO, startOfDay, endOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeTransactions } from '@/hooks/useTransactions';
import { useStaff } from '@/hooks/useStaff';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatCurrency, exportToExcel, exportToPDF, printReport } from '@/lib/utils';
import { StaffReport } from '@/types';

type FilterMode = 'month' | 'week' | 'custom';

export default function ReportsPage() {
  const { user } = useAuth();
  const { transactions } = useRealtimeTransactions(user?.shopId);
  const { staff } = useStaff(user?.shopId);

  const [filterMode, setFilterMode] = useState<FilterMode>('month');
  const [customFrom, setCustomFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [customTo, setCustomTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');

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
    const from = startOfDay(parseISO(customFrom));
    const to = endOfDay(parseISO(customTo));
    return {
      dateFrom: from,
      dateTo: to,
      rangeLabel: `${format(from, 'dd/MM/yyyy')} – ${format(to, 'dd/MM/yyyy')}`,
      rangeFilename: `${format(from, 'yyyyMMdd')}-${format(to, 'yyyyMMdd')}`,
    };
  }, [filterMode, customFrom, customTo]);

  const staffSuffix =
    selectedStaffId !== 'all'
      ? `-${(staffNameMap[selectedStaffId] ?? selectedStaffId).replace(/\s+/g, '-')}`
      : '';

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const d = t.createdAt.toDate();
      const inRange = d >= dateFrom && d <= dateTo;
      const inStaff = selectedStaffId === 'all' || t.staffId === selectedStaffId;
      return inRange && inStaff;
    });
  }, [transactions, dateFrom, dateTo, selectedStaffId]);

  const staffReports = useMemo((): StaffReport[] => {
    const map: Record<string, StaffReport> = {};
    filteredTransactions.forEach((t) => {
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
  }, [filteredTransactions, staffNameMap]);

  const totalRevenue = staffReports.reduce((s, r) => s + r.totalRevenue, 0);

  const reportTitle = () => {
    const staffLabel =
      selectedStaffId !== 'all' ? ` · ${staffNameMap[selectedStaffId] ?? ''}` : '';
    return `Báo cáo nhân viên – ${rangeLabel}${staffLabel}`;
  };

  const exportFilename = `bao-cao-nhan-vien-${rangeFilename}${staffSuffix}`;

  const handleExportExcel = () => {
    exportToExcel(
      staffReports.map((r) => ({
        'Nhân viên': r.staffName,
        'Số GD': r.customerCount,
        'Doanh thu (€)': r.totalRevenue,
        'TB/GD (€)': Math.round(r.avgRevenue),
      })),
      exportFilename
    );
  };

  const handleExportPDF = () => {
    exportToPDF(
      reportTitle(),
      ['Nhân viên', 'Số GD', 'Doanh thu', 'TB/GD'],
      staffReports.map((r) => [
        r.staffName,
        r.customerCount,
        formatCurrency(r.totalRevenue),
        formatCurrency(r.avgRevenue),
      ]),
      exportFilename
    );
  };

  const handlePrint = () => {
    printReport(
      reportTitle(),
      ['Nhân viên', 'Số GD', 'Doanh thu', 'TB/GD'],
      staffReports.map((r) => [
        r.staffName,
        r.customerCount,
        formatCurrency(r.totalRevenue),
        formatCurrency(r.avgRevenue),
      ]),
      exportFilename
    );
  };

  return (
    <div>
      <Header title="Báo cáo" subtitle={rangeLabel} />

      <div className="p-4 md:p-6 space-y-4 max-w-5xl">
        {/* Filter Panel */}
        <Card padding="sm">
          <div className="space-y-3">
            {/* Quick filter pills */}
            <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1">
              {([
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
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
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
                  <label className="text-xs text-gray-400 mb-1 block">Từ ngày</label>
                  <input
                    type="date"
                    value={customFrom}
                    max={customTo}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <span className="text-gray-400 pb-2">→</span>
                <div className="flex-1">
                  <label className="text-xs text-gray-400 mb-1 block">Đến ngày</label>
                  <input
                    type="date"
                    value={customTo}
                    min={customFrom}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            )}

            {/* Staff filter */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Lọc theo nhân viên</label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Tất cả nhân viên</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <Card padding="sm" className="text-center">
            <p className="text-xs text-gray-400 mb-1">Tổng DT</p>
            <p className="font-bold text-primary-600 text-xs sm:text-sm truncate">{formatCurrency(totalRevenue)}</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-xs text-gray-400 mb-1">Giao dịch</p>
            <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{filteredTransactions.length}</p>
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

        {/* Staff Report */}
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
                      <p className="text-xs text-gray-400">{r.customerCount} GD · TB: {formatCurrency(r.avgRevenue)}</p>
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
      </div>
    </div>
  );
}
