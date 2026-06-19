'use client';

import { motion } from 'framer-motion';
import { Phone, Mail, MoreVertical, Lock, Unlock, Trash2, Edit, ShieldCheck, ShieldMinus, KeyRound } from 'lucide-react';
import { User, UserRole } from '@/types';
import { getInitials } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import { useState } from 'react';

interface EmployeeCardProps {
  employee: User;
  index?: number;
  currentUserRole?: UserRole;
  canEdit?: boolean;
  onEdit?: () => void;
  onToggleActive?: () => void;
  onDelete?: () => void;
  onResetPassword?: () => void;
  onViewPassword?: () => void;
  onPromote?: () => void; // chỉ owner mới truyền
}

const roleLabel: Record<string, { label: string; variant: 'primary' | 'warning' | 'gray' }> = {
  manager:     { label: 'Quản lý',    variant: 'primary' },
  staff:       { label: 'Nhân viên',  variant: 'gray' },
  owner:       { label: 'Chủ tiệm',   variant: 'warning' },
  super_admin: { label: 'Super Admin', variant: 'warning' },
};

export default function EmployeeCard({
  employee,
  index = 0,
  currentUserRole,
  canEdit = true,
  onEdit,
  onToggleActive,
  onDelete,
  onResetPassword,
  onViewPassword,
  onPromote,
}: EmployeeCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = getInitials(employee.name);
  const roleMeta = roleLabel[employee.role] ?? { label: employee.role, variant: 'gray' };

  const isManager = employee.role === 'manager';
  const isOwner   = employee.role === 'owner';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-card"
    >
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-400 to-secondary-300 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{employee.name}</p>
            <Badge variant={roleMeta.variant as 'primary' | 'warning' | 'gray'} size="sm">
              {isManager && <ShieldCheck size={10} />}
              {roleMeta.label}
            </Badge>
            <Badge variant={employee.active ? 'success' : 'danger'} size="sm">
              {employee.active ? 'Hoạt động' : 'Đã khóa'}
            </Badge>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Phone size={11} className="text-gray-400" />
            <span className="text-xs text-gray-400">{employee.phone || 'Chưa có SĐT'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Mail size={11} className="text-gray-400" />
            <span className="text-xs text-gray-400 truncate">{employee.email}</span>
          </div>
        </div>

        {/* Menu — ẩn nếu không có quyền và không có action nào */}
        {(canEdit || onPromote) && (
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
                <div className="absolute right-0 top-10 z-20 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden min-w-[180px]">

                  {canEdit && onEdit && (
                    <button
                      onClick={() => { setMenuOpen(false); onEdit(); }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      <Edit size={14} /> Chỉnh sửa
                    </button>
                  )}

                  {canEdit && onViewPassword && (
                    <button
                      onClick={() => { setMenuOpen(false); onViewPassword(); }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      <KeyRound size={14} /> Xem / Đổi mật khẩu
                    </button>
                  )}

                  {canEdit && onResetPassword && (
                    <button
                      onClick={() => { setMenuOpen(false); onResetPassword(); }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      <Mail size={14} /> Gửi email đặt lại
                    </button>
                  )}

                  {/* Phong/Hạ chức — chỉ owner mới thấy, không áp dụng cho owner/super_admin */}
                  {onPromote && !isOwner && (
                    <button
                      onClick={() => { setMenuOpen(false); onPromote(); }}
                      className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        isManager ? 'text-amber-600' : 'text-primary-600'
                      }`}
                    >
                      {isManager
                        ? <><ShieldMinus size={14} /> Hạ xuống Nhân viên</>
                        : <><ShieldCheck size={14} /> Phong làm Quản lý</>
                      }
                    </button>
                  )}

                  {canEdit && onToggleActive && (
                    <button
                      onClick={() => { setMenuOpen(false); onToggleActive(); }}
                      className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        employee.active ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                    >
                      {employee.active ? <Lock size={14} /> : <Unlock size={14} />}
                      {employee.active ? 'Khóa tài khoản' : 'Mở khóa'}
                    </button>
                  )}

                  {canEdit && onDelete && (
                    <button
                      onClick={() => { setMenuOpen(false); onDelete(); }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-red-500"
                    >
                      <Trash2 size={14} /> Xóa
                    </button>
                  )}

                  {!canEdit && !onPromote && (
                    <p className="px-4 py-2.5 text-xs text-gray-400">Không có quyền</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
