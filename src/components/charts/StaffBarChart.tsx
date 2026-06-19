'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatCurrency, truncate } from '@/lib/utils';
import { StaffReport } from '@/types';

interface StaffBarChartProps {
  data: StaffReport[];
}

const COLORS = ['#A78BFA', '#D8B4FE', '#A7F3D0', '#FBC8D4', '#93C5FD'];

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-3 text-sm">
        <p className="font-semibold text-gray-600 dark:text-gray-300 mb-1">{label}</p>
        <p className="text-primary-600 font-bold">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export default function StaffBarChart({ data }: StaffBarChartProps) {
  const chartData = data.map((s) => ({
    name: truncate(s.staffName, 8),
    revenue: s.totalRevenue,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
