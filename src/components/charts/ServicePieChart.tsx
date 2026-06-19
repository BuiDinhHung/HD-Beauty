'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ServiceReport } from '@/types';
import { truncate } from '@/lib/utils';

interface ServicePieChartProps {
  data: ServiceReport[];
}

const COLORS = ['#A78BFA', '#D8B4FE', '#A7F3D0', '#FBC8D4', '#93C5FD'];

export default function ServicePieChart({ data }: ServicePieChartProps) {
  const chartData = data.map((s) => ({
    name: truncate(s.serviceName, 12),
    value: s.usageCount,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          outerRadius={80}
          innerRadius={45}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [`${value} lượt`, 'Số lượt']}
          contentStyle={{
            borderRadius: '12px',
            border: 'none',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}
        />
        <Legend
          formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
