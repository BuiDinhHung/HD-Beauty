'use client';

import { motion } from 'framer-motion';
import { User, Clock, Tag, Phone } from 'lucide-react';
import { Transaction } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface TransactionCardProps {
  transaction: Transaction;
  index?: number;
  onDelete?: () => void;
}

export default function TransactionCard({ transaction, index = 0, onDelete }: TransactionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-300 flex items-center justify-center flex-shrink-0">
            <User size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {transaction.customerName}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <Phone size={11} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-400 truncate">
                {transaction.customerPhone || 'Không có SĐT'}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-primary-600 dark:text-primary-400">
            {formatCurrency(transaction.totalAmount)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{transaction.staffName}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {transaction.serviceNames.map((name, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
          >
            <Tag size={10} />
            {name}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock size={11} />
          {formatDateTime(transaction.createdAt.toDate())}
        </div>
        {onDelete && (
          <button
            onClick={onDelete}
            className="text-xs text-red-400 hover:text-red-500 transition-colors"
          >
            Xóa
          </button>
        )}
      </div>

      {transaction.note && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2">
          📝 {transaction.note}
        </p>
      )}
    </motion.div>
  );
}
