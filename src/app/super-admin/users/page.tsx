'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, Shop } from '@/types';
import { updateStaff, toggleStaffActive, deleteStaff } from '@/services/staff.service';
import { setStaffPassword, resetStaffPassword, createUserForShop } from '@/services/auth.service';
import { decryptPassword } from '@/lib/crypto';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Badge from '@/components/ui/Badge';
import SearchBar from '@/components/ui/SearchBar';
import { SkeletonList } from '@/components/ui/Loading';
import { getInitials } from '@/lib/utils';
import {
  RefreshCw, Eye, EyeOff, Copy, Check, Lock, Unlock, Trash2,
  Edit, Shield, ShieldCheck, Crown, KeyRound, Mail, ChevronDown, UserPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface UserWithShop extends User {
  shopName: string;
}

const ROLE_META: Record<string, { label: string; color: string }> = {
  owner:   { label: 'Chủ tiệm',   color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400' },
  manager: { label: 'Quản lý',    color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/30 dark:text-primary-400' },
  staff:   { label: 'Nhân viên',  color: 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300' },
};

const ASSIGNABLE_ROLES = ['owner', 'manager', 'staff'] as const;

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<UserWithShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterShopId, setFilterShopId] = useState('all');
  const [shops, setShops] = useState<Shop[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserWithShop | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<string>('staff');

  // Password modal
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdUser, setPwdUser] = useState<UserWithShop | null>(null);
  const [currentPwd, setCurrentPwd] = useState('');
  const [pwdVisible, setPwdVisible] = useState(false);
  const [pwdCopied, setPwdCopied] = useState(false);
  const [newPwd, setNewPwd] = useState('');
  const [newPwdVisible, setNewPwdVisible] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  // Delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<UserWithShop | null>(null);

  // Create user modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createPwdVisible, setCreatePwdVisible] = useState(false);
  const [createRole, setCreateRole] = useState<'owner' | 'manager' | 'staff'>('staff');
  const [createShopId, setCreateShopId] = useState('');
  const [creating, setCreating] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      const [shopsSnap, usersSnap] = await Promise.all([
        getDocs(collection(db, 'shops')),
        getDocs(collection(db, 'users')),
      ]);

      const shopMap = new Map<string, string>();
      const shopList: Shop[] = [];
      shopsSnap.docs.forEach((d) => {
        const s = { id: d.id, ...d.data() } as Shop;
        shopMap.set(s.id, s.name);
        shopList.push(s);
      });
      setShops(shopList.sort((a, b) => a.name.localeCompare(b.name)));

      const allUsers: UserWithShop[] = usersSnap.docs
        .map((d) => {
          const u = { id: d.id, ...d.data() } as User;
          return { ...u, shopName: shopMap.get(u.shopId) || 'Chưa gán tiệm' };
        })
        .filter((u) => u.role !== 'super_admin')
        .sort((a, b) => a.shopName.localeCompare(b.shopName) || a.name.localeCompare(b.name));

      setUsers(allUsers);
    } catch (err) {
      console.error('fetchData error:', err);
      toast.error('Không thể tải dữ liệu. Kiểm tra Firestore rules.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setCreateName(''); setCreatePhone(''); setCreateEmail('');
    setCreatePassword(''); setCreatePwdVisible(false);
    setCreateRole('staff');
    setCreateShopId(shops[0]?.id ?? '');
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!createName.trim() || !createEmail.trim() || createPassword.length < 6 || !createShopId) return;
    setCreating(true);
    try {
      await createUserForShop(createShopId, createEmail.trim(), createPassword, createName.trim(), createPhone, createRole);
      toast.success(`Đã tạo tài khoản "${createName.trim()}"!`);
      setCreateOpen(false);
      fetchData();
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/email-already-in-use') toast.error('Email đã được sử dụng');
      else toast.error('Không thể tạo tài khoản. Thử lại.');
    } finally {
      setCreating(false);
    }
  };

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchShop = filterShopId === 'all' || u.shopId === filterShopId;
      const q = search.toLowerCase();
      const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      return matchShop && matchSearch;
    });
  }, [users, search, filterShopId]);

  // Group by shop
  const grouped = useMemo(() => {
    const map = new Map<string, { shopName: string; users: UserWithShop[] }>();
    filtered.forEach((u) => {
      const key = u.shopId || '__unassigned__';
      if (!map.has(key)) map.set(key, { shopName: u.shopName, users: [] });
      map.get(key)!.users.push(u);
    });
    return Array.from(map.values());
  }, [filtered]);

  // ── Edit ─────────────────────────────────────────────────────
  const openEdit = (u: UserWithShop) => {
    setEditUser(u);
    setEditName(u.name);
    setEditPhone(u.phone || '');
    setEditRole(u.role);
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editUser) return;
    setSubmitting(true);
    try {
      await updateStaff(editUser.id, { name: editName, phone: editPhone, role: editRole as User['role'] });
      toast.success('Đã cập nhật!');
      setUsers((prev) => prev.map((u) => u.id === editUser.id
        ? { ...u, name: editName, phone: editPhone, role: editRole as User['role'] }
        : u
      ));
      setEditOpen(false);
    } catch {
      toast.error('Không thể cập nhật');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Toggle active ────────────────────────────────────────────
  const handleToggleActive = async (u: UserWithShop) => {
    try {
      await toggleStaffActive(u.id, !u.active);
      toast.success(u.active ? 'Đã khóa tài khoản' : 'Đã mở khóa');
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, active: !u.active } : x));
    } catch {
      toast.error('Không thể thực hiện');
    }
  };

  // ── Delete ───────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteUser) return;
    setSubmitting(true);
    try {
      await deleteStaff(deleteUser.id);
      toast.success('Đã xóa tài khoản');
      setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id));
      setDeleteOpen(false);
    } catch {
      toast.error('Không thể xóa');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Password ─────────────────────────────────────────────────
  const openPassword = async (u: UserWithShop) => {
    setPwdUser(u);
    setCurrentPwd('');
    setNewPwd('');
    setPwdVisible(false);
    setPwdCopied(false);
    setPwdOpen(true);
    if (u.encryptedPassword) {
      setPwdLoading(true);
      try {
        setCurrentPwd(await decryptPassword(u.encryptedPassword));
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
    if (!pwdUser || newPwd.length < 6) return;
    setSubmitting(true);
    try {
      const { auth: firebaseAuth } = await import('@/lib/firebase');
      const idToken = await firebaseAuth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ uid: pwdUser.id, newPassword: newPwd }),
      });
      if (!res.ok) throw new Error('api error');
      toast.success('Đã đặt mật khẩu mới!');
      setCurrentPwd(newPwd);
      setNewPwd('');
    } catch {
      toast.error('Không thể đổi mật khẩu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReset = async (u: UserWithShop) => {
    try {
      await resetStaffPassword(u.email);
      toast.success(`Đã gửi email đặt lại tới ${u.email}`);
    } catch {
      toast.error('Không thể gửi email');
    }
  };

  // ── Render ───────────────────────────────────────────────────
  const UserRow = ({ u, index }: { u: UserWithShop; index: number }) => {
    const meta = ROLE_META[u.role] ?? ROLE_META.staff;
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className="flex items-center gap-3 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0"
      >
        {/* Avatar */}
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-300 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {getInitials(u.name)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{u.name}</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${meta.color}`}>
              {meta.label}
            </span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
              u.active ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' : 'text-red-600 bg-red-50 dark:bg-red-900/30'
            }`}>
              {u.active ? 'Hoạt động' : 'Đã khóa'}
            </span>
          </div>
          <p className="text-xs text-gray-400 truncate">{u.email}</p>
          {u.phone && <p className="text-xs text-gray-400">{u.phone}</p>}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => openEdit(u)}
            title="Chỉnh sửa"
            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => openPassword(u)}
            title="Mật khẩu"
            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
          >
            <KeyRound size={14} />
          </button>
          <button
            onClick={() => handleSendReset(u)}
            title="Gửi email đặt lại mật khẩu"
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <Mail size={14} />
          </button>
          <button
            onClick={() => handleToggleActive(u)}
            title={u.active ? 'Khóa tài khoản' : 'Mở khóa'}
            className={`p-1.5 rounded-lg transition-colors ${
              u.active
                ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
            }`}
          >
            {u.active ? <Lock size={14} /> : <Unlock size={14} />}
          </button>
          <button
            onClick={() => { setDeleteUser(u); setDeleteOpen(true); }}
            title="Xóa"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Người dùng</h1>
          <p className="text-sm text-gray-400 mt-1">{users.length} tài khoản trong hệ thống</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={14} /> Làm mới
          </button>
          <button
            onClick={openCreate}
            disabled={shops.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-primary text-white text-sm font-medium shadow-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <UserPlus size={14} /> Thêm nhân viên
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <SearchBar
            placeholder="Tìm tên, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
          />
        </div>
        <div className="relative">
          <select
            value={filterShopId}
            onChange={(e) => setFilterShopId(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 outline-none focus:border-primary-400 cursor-pointer"
          >
            <option value="all">Tất cả tiệm</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* User list grouped by shop */}
      {loading ? (
        <SkeletonList count={6} />
      ) : grouped.length === 0 ? (
        <Card>
          <p className="text-center text-gray-400 py-8">
            {search || filterShopId !== 'all' ? 'Không tìm thấy' : 'Chưa có người dùng'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ shopName, users: groupUsers }) => (
            <Card key={shopName}>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-gray-800">
                <Crown size={14} className="text-amber-500" />
                <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">{shopName}</span>
                <span className="text-xs text-gray-400 ml-auto">{groupUsers.length} người</span>
              </div>
              {groupUsers.map((u, i) => (
                <UserRow key={u.id} u={u} index={i} />
              ))}
            </Card>
          ))}
        </div>
      )}

      {/* Create User Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Thêm nhân viên / Owner">
        <div className="space-y-4">
          {/* Shop selector */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Tiệm</label>
            <div className="relative">
              <select
                value={createShopId}
                onChange={(e) => setCreateShopId(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 outline-none focus:border-primary-400 cursor-pointer"
              >
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Role picker */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Vai trò</label>
            <div className="flex rounded-2xl bg-gray-100 dark:bg-gray-800 p-1 gap-1">
              {ASSIGNABLE_ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setCreateRole(r)}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium rounded-xl transition-all ${
                    createRole === r
                      ? 'bg-white dark:bg-gray-900 text-primary-600 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  {r === 'owner' && <Crown size={12} />}
                  {r === 'manager' && <ShieldCheck size={12} />}
                  {r === 'staff' && <Shield size={12} />}
                  {ROLE_META[r].label}
                </button>
              ))}
            </div>
          </div>

          {/* Fields */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Họ tên *</label>
            <input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm outline-none focus:border-primary-400"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Số điện thoại</label>
            <input
              value={createPhone}
              onChange={(e) => setCreatePhone(e.target.value)}
              placeholder="0901234567"
              type="tel"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm outline-none focus:border-primary-400"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Email đăng nhập *</label>
            <input
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
              placeholder="nhanvien@email.com"
              type="email"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm outline-none focus:border-primary-400"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Mật khẩu * (ít nhất 6 ký tự)</label>
            <div className="relative">
              <input
                type={createPwdVisible ? 'text' : 'password'}
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="Ít nhất 6 ký tự"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 pr-10 text-sm outline-none focus:border-primary-400"
              />
              <button
                type="button"
                onClick={() => setCreatePwdVisible(!createPwdVisible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {createPwdVisible ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => setCreateOpen(false)}>Hủy</Button>
            <Button
              fullWidth
              loading={creating}
              disabled={!createName.trim() || !createEmail.trim() || createPassword.length < 6 || !createShopId}
              onClick={handleCreate}
            >
              <UserPlus size={16} /> Tạo tài khoản
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`Chỉnh sửa — ${editUser?.name}`}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Họ tên</label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm outline-none focus:border-primary-400"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Số điện thoại</label>
            <input
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm outline-none focus:border-primary-400"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Vai trò</label>
            <div className="flex rounded-2xl bg-gray-100 dark:bg-gray-800 p-1 gap-1">
              {ASSIGNABLE_ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setEditRole(r)}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium rounded-xl transition-all ${
                    editRole === r
                      ? 'bg-white dark:bg-gray-900 text-primary-600 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  {r === 'owner' && <Crown size={12} />}
                  {r === 'manager' && <ShieldCheck size={12} />}
                  {r === 'staff' && <Shield size={12} />}
                  {ROLE_META[r].label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => setEditOpen(false)}>Hủy</Button>
            <Button fullWidth loading={submitting} onClick={handleEdit} disabled={!editName.trim()}>
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </Modal>

      {/* Password Modal */}
      <Modal open={pwdOpen} onClose={() => setPwdOpen(false)} title={`Mật khẩu — ${pwdUser?.name}`}>
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mật khẩu hiện tại</p>
            {pwdLoading ? (
              <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ) : currentPwd ? (
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5 border border-gray-200 dark:border-gray-700">
                <span className="flex-1 font-mono text-sm tracking-widest text-gray-900 dark:text-gray-100">
                  {pwdVisible ? currentPwd : '•'.repeat(Math.min(currentPwd.length, 16))}
                </span>
                <button onClick={() => setPwdVisible(!pwdVisible)} className="p-1 text-gray-400 hover:text-gray-600">
                  {pwdVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button onClick={handleCopyPwd} className="p-1 text-gray-400 hover:text-green-600 transition-colors">
                  {pwdCopied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-400 italic">
                  Tài khoản này chưa lưu mật khẩu.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pwdUser && handleSendReset(pwdUser)}
                >
                  <Mail size={14} /> Gửi email đặt lại
                </Button>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Đặt mật khẩu mới trực tiếp</p>
              <div className="relative">
                <input
                  type={newPwdVisible ? 'text' : 'password'}
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="Ít nhất 6 ký tự"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 pr-10 text-sm outline-none focus:border-primary-400"
                />
                <button
                  type="button"
                  onClick={() => setNewPwdVisible(!newPwdVisible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {newPwdVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <Button fullWidth loading={submitting} disabled={newPwd.length < 6} onClick={handleSetNewPassword}>
                Đặt mật khẩu
              </Button>
            </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Xóa tài khoản"
        description={`Xóa tài khoản "${deleteUser?.name}" (${deleteUser?.email})? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        loading={submitting}
      />
    </div>
  );
}
