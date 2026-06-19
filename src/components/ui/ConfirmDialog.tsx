'use client';

import { ReactNode } from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div
          className={`p-4 rounded-full ${
            variant === 'danger'
              ? 'bg-red-100 text-red-500'
              : variant === 'warning'
              ? 'bg-amber-100 text-amber-500'
              : 'bg-primary-100 text-primary-500'
          }`}
        >
          <AlertTriangle size={28} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        <div className="flex gap-3 w-full">
          <Button variant="outline" fullWidth onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            fullWidth
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
