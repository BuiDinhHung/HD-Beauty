'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogOut, Moon, Sun, Lock, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { changePassword } from '@/services/auth.service';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import AvatarUpload from '@/components/shared/AvatarUpload';
import { getInitials } from '@/lib/utils';

const passSchema = z
  .object({
    current: z.string().min(6),
    next: z.string().min(6, 'Ít nhất 6 ký tự'),
    confirm: z.string(),
  })
  .refine((d) => d.next === d.confirm, {
    message: 'Mật khẩu không khớp',
    path: ['confirm'],
  });

type PassFormData = z.infer<typeof passSchema>;

export default function StaffProfilePage() {
  const { user, shop, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const [passModalOpen, setPassModalOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const passForm = useForm<PassFormData>({ resolver: zodResolver(passSchema) });

  const handleChangePass = async (data: PassFormData) => {
    setSubmitting(true);
    try {
      await changePassword(data.current, data.next);
      toast.success('Đổi mật khẩu thành công!');
      passForm.reset();
      setPassModalOpen(false);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        toast.error('Mật khẩu hiện tại không đúng');
      } else {
        toast.error('Không thể đổi mật khẩu');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const initials = getInitials(user?.name || 'U');

  return (
    <div>
      <Header title="Hồ sơ" showThemeToggle={false} />

      <div className="p-4 space-y-5">
        {/* Avatar */}
        <div className="flex flex-col items-center py-6">
          <div className="mb-4">
            <AvatarUpload
              userId={user?.id ?? ''}
              photoURL={user?.photoURL}
              initials={initials}
            />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{user?.name}</h2>
          <p className="text-sm text-gray-400 mt-1">{user?.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-medium">
              Nhân viên
            </span>
            {shop && (
              <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs font-medium">
                {shop.name}
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <Card>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-gray-400">Họ tên</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{user?.name}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">Điện thoại</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{user?.phone || 'Chưa có'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">Email</span>
              <span className="font-medium text-gray-900 dark:text-gray-100 text-xs">{user?.email}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">Tiệm</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{shop?.name}</span>
            </div>
          </div>
        </Card>

        {/* Settings */}
        <Card padding="none">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-between w-full px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-t-3xl transition-colors"
          >
            <div className="flex items-center gap-3">
              {isDark ? <Moon size={18} className="text-gray-500" /> : <Sun size={18} className="text-gray-500" />}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isDark ? 'Chế độ tối' : 'Chế độ sáng'}
              </span>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
          <div className="h-px bg-gray-100 dark:bg-gray-800 mx-4" />
          <button
            onClick={() => setPassModalOpen(true)}
            className="flex items-center justify-between w-full px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-b-3xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <Lock size={18} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Đổi mật khẩu</span>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
        </Card>

        <Button variant="danger" fullWidth onClick={() => setLogoutConfirm(true)}>
          <LogOut size={16} /> Đăng xuất
        </Button>
      </div>

      {/* Password Modal */}
      <Modal open={passModalOpen} onClose={() => setPassModalOpen(false)} title="Đổi mật khẩu">
        <form onSubmit={passForm.handleSubmit(handleChangePass)} className="space-y-4">
          <Input label="Mật khẩu hiện tại" type="password" error={passForm.formState.errors.current?.message} {...passForm.register('current')} />
          <Input label="Mật khẩu mới" type="password" error={passForm.formState.errors.next?.message} {...passForm.register('next')} />
          <Input label="Xác nhận" type="password" error={passForm.formState.errors.confirm?.message} {...passForm.register('confirm')} />
          <div className="flex gap-3">
            <Button variant="outline" fullWidth type="button" onClick={() => setPassModalOpen(false)}>Hủy</Button>
            <Button fullWidth type="submit" loading={submitting}>Đổi</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={logoutConfirm}
        onClose={() => setLogoutConfirm(false)}
        onConfirm={logout}
        title="Đăng xuất"
        description="Bạn có chắc muốn đăng xuất không?"
        confirmLabel="Đăng xuất"
        variant="danger"
      />
    </div>
  );
}
