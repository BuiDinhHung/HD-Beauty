'use client';

import { motion } from 'framer-motion';
import { Tag, MoreVertical, Edit, Trash2, Power } from 'lucide-react';
import { Service } from '@/types';
import { formatCurrency } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import { useState } from 'react';

interface ServiceCardProps {
  service: Service;
  index?: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleActive?: () => void;
}

export default function ServiceCard({
  service,
  index = 0,
  onEdit,
  onDelete,
  onToggleActive,
}: ServiceCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-card"
    >
      <div className="flex items-center gap-4">
        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-secondary-300 to-primary-400 flex items-center justify-center text-white flex-shrink-0">
          <Tag size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{service.name}</p>
            <Badge variant={service.active ? 'success' : 'gray'} size="sm">
              {service.active ? 'Hoạt động' : 'Ẩn'}
            </Badge>
          </div>
          <p className="text-primary-600 dark:text-primary-400 font-bold mt-0.5">
            {formatCurrency(service.price)}
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <MoreVertical size={18} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-10 z-20 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden min-w-[150px]">
                {onEdit && (
                  <button
                    onClick={() => { setMenuOpen(false); onEdit(); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    <Edit size={14} /> Chỉnh sửa
                  </button>
                )}
                {onToggleActive && (
                  <button
                    onClick={() => { setMenuOpen(false); onToggleActive(); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-amber-600"
                  >
                    <Power size={14} /> {service.active ? 'Ẩn' : 'Hiện'}
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-red-500"
                  >
                    <Trash2 size={14} /> Xóa
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
