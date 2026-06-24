'use client';

import { motion } from 'framer-motion';
import { User, Clock } from 'lucide-react';
import { Transaction } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface TransactionCardProps {
  transaction: Transaction;
  index?: number;
  onDelete?: () => void;
  onEdit?: () => void;
}

export default function TransactionCard({ transaction, index = 0, onDelete, onEdit }: TransactionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-card"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-300 flex items-center justify-center flex-shrink-0">
            <User size={18} className="text-white" />
          </div>
          <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
            {transaction.staffName}
          </p>
        </div>
        <p className="font-bold text-primary-600 dark:text-primary-400 flex-shrink-0">
          {formatCurrency(transaction.totalAmount)}
        </p>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock size={11} />
          {formatDateTime(transaction.createdAt.toDate())}
        </div>
        <div className="flex items-center gap-3">
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            >
              Sửa
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="text-xs text-red-400 hover:text-red-500 transition-colors"
            >
              Xóa
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
