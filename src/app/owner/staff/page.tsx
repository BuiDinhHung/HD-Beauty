'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Users, ShieldCheck, User as UserIcon, Eye, EyeOff, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useStaff } from '@/hooks/useStaff';
import { createStaffAccount, resetStaffPassword, setStaffPassword } from '@/services/auth.service';
import { updateStaff, toggleStaffActive, deleteStaff } from '@/services/staff.service';
import { decryptPassword } from '@/lib/crypto';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmployeeCard from '@/components/shared/EmployeeCard';
import SearchBar from '@/components/ui/SearchBar';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/Loading';
import { User, UserRole } from '@/types';

const addSchema = z.object({
  name: z.string().min(2, 'Tên ít nhất 2 ký tự'),
  phone: z.string().optional(),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
  role: z.enum(['staff', 'manager']),
});

const editSchema = z.object({
  name: z.string().min(2, 'Tên ít nhất 2 ký tự'),
  phone: z.string().optional(),
});

type AddFormData = z.infer<typeof addSchema>;
type EditFormData = z.infer<typeof editSchema>;

export default function StaffPage() {
  const { user, isOwner, isManager, canEditUser } = useAuth();
  const { staff, loading } = useStaff(user?.shopId);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdStaff, setPwdStaff] = useState<User | null>(null);
  const [currentPwd, setCurrentPwd] = useState('');
  const [pwdVisible, setPwdVisible] = useState(false);
  const [pwdCopied, setPwdCopied] = useState(false);
  const [newPwdValue, setNewPwdValue] = useState('');
  const [newPwdVisible, setNewPwdVisible] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  const addForm = useForm<AddFormData>({
    resolver: zodResolver(addSchema),
    defaultValues: { role: 'staff' },
  });
  const editForm = useForm<EditFormData>({ resolver: zodResolver(editSchema) });

  const filtered = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  const managers = filtered.filter((s) => s.role === 'manager');
  const staffOnly = filtered.filter((s) => s.role === 'staff');

  const handleAdd = async (data: AddFormData) => {
    if (!user?.shopId) return;
    setSubmitting(true);
    try {
      await createStaffAccount(
        data.email,
        data.password,
        data.name,
        data.phone || '',
        user.shopId,
        data.role as UserRole
      );
      toast.success(`Thêm ${data.role === 'manager' ? 'quản lý' : 'nhân viên'} thành công!`);
      addForm.reset({ role: 'staff' });
      setAddOpen(false);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/email-already-in-use') toast.error('Email đã được sử dụng');
      else toast.error('Không thể thêm');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (data: EditFormData) => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await updateStaff(selected.id, { name: data.name, phone: data.phone || '' });
      toast.success('Cập nhật thành công!');
      setEditOpen(false);
    } catch {
      toast.error('Không thể cập nhật');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (s: User) => {
    if (!canEditUser(s)) {
      toast.error('Bạn không có quyền thực hiện thao tác này');
      return;
    }
    try {
      await toggleStaffActive(s.id, !s.active);
      toast.success(s.active ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
    } catch {
      toast.error('Không thể thực hiện');
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await deleteStaff(selected.id);
      toast.success('Đã xóa');
      setDeleteOpen(false);
    } catch {
      toast.error('Không thể xóa');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePromote = async () => {
    if (!selected) return;
    setSubmitting(true);
    const newRole: UserRole = selected.role === 'manager' ? 'staff' : 'manager';
    try {
      await updateStaff(selected.id, { role: newRole });
      toast.success(
        newRole === 'manager' ? `Đã phong ${selected.name} làm Quản lý!` : `Đã hạ ${selected.name} xuống Nhân viên`
      );
      setPromoteOpen(false);
    } catch {
      toast.error('Không thể thay đổi quyền');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (s: User) => {
    try {
      await resetStaffPassword(s.email);
      toast.success(`Đã gửi email đặt lại mật khẩu tới ${s.email}`);
    } catch {
      toast.error('Không thể gửi email');
    }
  };

  const openViewPassword = async (s: User) => {
    setPwdStaff(s);
    setCurrentPwd('');
    setNewPwdValue('');
    setPwdVisible(false);
    setPwdCopied(false);
    setPwdOpen(true);
    if (s.encryptedPassword) {
      setPwdLoading(true);
      try {
        const plain = await decryptPassword(s.encryptedPassword);
        setCurrentPwd(plain);
      } catch {
        setCurrentPwd('');
      } finally {
        setPwdLoading(false);
      }
    }
  };

  const handleCopyPwd = () => {
    navigator.clipboard.writeText(currentPwd);
    setPwdCopied(true);
    setTimeout(() => setPwdCopied(false), 2000);
  };

  const handleSetNewPassword = async () => {
    if (!pwdStaff || !pwdStaff.encryptedPassword || newPwdValue.length < 6) return;
    setSubmitting(true);
    try {
      const newEncPwd = await setStaffPassword(pwdStaff.id, pwdStaff.email, pwdStaff.encryptedPassword, newPwdValue);
      toast.success('Đã đổi mật khẩu thành công!');
      setCurrentPwd(newPwdValue);
      setNewPwdValue('');
      setPwdStaff((prev) => prev ? { ...prev, encryptedPassword: newEncPwd } : null);
    } catch {
      toast.error('Không thể đổi mật khẩu. Kiểm tra lại mật khẩu cũ.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (s: User) => {
    if (!canEditUser(s)) {
      toast.error('Bạn không có quyền sửa thông tin này');
      return;
    }
    setSelected(s);
    editForm.reset({ name: s.name, phone: s.phone });
    setEditOpen(true);
  };

  const openDelete = (s: User) => {
    if (!canEditUser(s)) {
      toast.error('Bạn không có quyền xóa tài khoản này');
      return;
    }
    setSelected(s);
    setDeleteOpen(true);
  };

  const openPromote = (s: User) => {
    setSelected(s);
    setPromoteOpen(true);
  };

  const Section = ({ title, icon, items }: { title: string; icon: React.ReactNode; items: User[] }) => (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {title} ({items.length})
        </h3>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400 pl-6">Chưa có</p>
      ) : (
        <div className="space-y-3">
          {items.map((s, i) => (
            <EmployeeCard
              key={s.id}
              employee={s}
              index={i}
              currentUserRole={user?.role}
              canEdit={canEditUser(s)}
              onEdit={() => openEdit(s)}
              onToggleActive={() => handleToggleActive(s)}
              onDelete={() => openDelete(s)}
              onViewPassword={canEditUser(s) ? () => openViewPassword(s) : undefined}
              onResetPassword={() => handleResetPassword(s)}
              onPromote={isOwner ? () => openPromote(s) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <Header
        title="Nhân viên"
        subtitle={`${staff.length} thành viên`}
        rightAction={
          <Button size="icon" onClick={() => { addForm.reset({ role: 'staff' }); setAddOpen(true); }}>
            <Plus size={18} />
          </Button>
        }
      />

      <div className="p-4 md:p-6 space-y-6 max-w-5xl">
        <SearchBar
          placeholder="Tìm tên, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
        />

        {loading ? (
          <SkeletonList count={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users size={36} />}
            title={search ? 'Không tìm thấy' : 'Chưa có thành viên'}
            description="Thêm quản lý hoặc nhân viên để bắt đầu"
            action={
              !search && (
                <Button onClick={() => setAddOpen(true)}>
                  <Plus size={16} /> Thêm thành viên
                </Button>
              )
            }
          />
        ) : (
          <>
            <Section
              title="Quản lý"
              icon={<ShieldCheck size={16} className="text-primary-500" />}
              items={managers}
            />
            <Section
              title="Nhân viên"
              icon={<UserIcon size={16} className="text-gray-400" />}
              items={staffOnly}
            />
          </>
        )}
      </div>

      {/* Add Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Thêm thành viên">
        <form onSubmit={addForm.handleSubmit(handleAdd)} className="space-y-4">
          {/* Role selector — chệ owner mới được tạo manager */}
          {isOwner && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Vai trò
              </label>
              <div className="flex rounded-2xl bg-gray-100 dark:bg-gray-800 p-1">
                {(['staff', 'manager'] as const).map((r) => (
                  <label key={r} className="flex-1">
                    <input type="radio" value={r} {...addForm.register('role')} className="sr-only" />
                    <span
                      className={`block text-center py-2 text-sm font-medium rounded-xl cursor-pointer transition-all ${
                        addForm.watch('role') === r
                          ? 'bg-white dark:bg-gray-900 text-primary-600 shadow-sm'
                          : 'text-gray-500'
                      }`}
                    >
                      {r === 'manager' ? '🛡 Quản lý' : '👤 Nhân viên'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <Input label="Họ tên" placeholder="Nguyễn Văn A" error={addForm.formState.errors.name?.message} {...addForm.register('name')} />
          <Input label="Số điện thoại" placeholder="0901234567" type="tel" {...addForm.register('phone')} />
          <Input label="Email đăng nhập" type="email" placeholder="staff@email.com" error={addForm.formState.errors.email?.message} {...addForm.register('email')} />
          <Input label="Mật khẩu" type="password" placeholder="Ít nhất 6 ký tự" error={addForm.formState.errors.password?.message} {...addForm.register('password')} />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth type="button" onClick={() => setAddOpen(false)}>Hủy</Button>
            <Button fullWidth type="submit" loading={submitting}>Thêm</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Chỉnh sửa">
        <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
          <Input label="Họ tên" error={editForm.formState.errors.name?.message} {...editForm.register('name')} />
          <Input label="Số điện thoại" type="tel" {...editForm.register('phone')} />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth type="button" onClick={() => setEditOpen(false)}>Hủy</Button>
            <Button fullWidth type="submit" loading={submitting}>Lưu</Button>
          </div>
        </form>
      </Modal>

      {/* Promote/Demote Confirm */}
      <ConfirmDialog
        open={promoteOpen}
        onClose={() => setPromoteOpen(false)}
        onConfirm={handlePromote}
        variant={selected?.role === 'manager' ? 'warning' : 'primary'}
        title={selected?.role === 'manager' ? 'Hạ xuống Nhân viên' : 'Phong làm Quản lý'}
        description={
          selected?.role === 'manager'
            ? `Hạ "${selected?.name}" từ Quản lý xuống Nhân viên?`
            : `Phong "${selected?.name}" làm Quản lý? Họ sẽ có quyền quản lý nhân viên và dịch vụ.`
        }
        confirmLabel={selected?.role === 'manager' ? 'Hạ xuống' : 'Phong chức'}
        loading={submitting}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Xóa tài khoản"
        description={`Bạn có chắc muốn xóa "${selected?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        loading={submitting}
      />

      {/* Password Modal */}
      <Modal
        open={pwdOpen}
        onClose={() => { setPwdOpen(false); setPwdStaff(null); }}
        title={`Mật khẩu — ${pwdStaff?.name}`}
      >
        <div className="space-y-5">
          {/* Mật khẩu hiện tại */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mật khẩu hiện tại</p>
            {pwdLoading ? (
              <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ) : currentPwd ? (
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5 border border-gray-200 dark:border-gray-700">
                <span className="flex-1 font-mono text-sm text-gray-900 dark:text-gray-100 tracking-widest">
                  {pwdVisible ? currentPwd : '•'.repeat(currentPwd.length)}
                </span>
                <button
                  onClick={() => setPwdVisible(!pwdVisible)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  {pwdVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button
                  onClick={handleCopyPwd}
                  className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                >
                  {pwdCopied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">
                Tài khoản này chưa lưu mật khẩu (tạo trước khi có tính năng này).
                Dùng &quot;Gửi email đặt lại&quot; để reset.
              </p>
            )}
          </div>

          {/* Đổi mật khẩu mới — chệ khi đã có mật khẩu lưu */}
          {pwdStaff?.encryptedPassword && (
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Đặt mật khẩu mới</p>
              <div className="relative">
                <input
                  type={newPwdVisible ? 'text' : 'password'}
                  value={newPwdValue}
                  onChange={(e) => setNewPwdValue(e.target.value)}
                  placeholder="Ít nhất 6 ký tự"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 pr-10 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-primary-400"
                />
                <button
                  type="button"
                  onClick={() => setNewPwdVisible(!newPwdVisible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {newPwdVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <Button
                fullWidth
                loading={submitting}
                disabled={newPwdValue.length < 6}
                onClick={handleSetNewPassword}
              >
                Cập nhật mật khẩu
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

