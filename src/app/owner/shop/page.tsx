'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Store, Pencil, Check, MapPin, Phone, Clock, Hourglass, CalendarDays, CalendarOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { updateShop } from '@/services/shop.service';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

// 6:00 → 23:00, mỗi 30 phút
const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 23; h++) {
  TIME_OPTIONS.push(`${h}:00`);
  if (h < 23) TIME_OPTIONS.push(`${h}:30`);
}

const CLOSED = 'Đóng cửa';

type PeriodState = { isClosed: boolean; from: string; to: string };

function parsePeriod(value: string | undefined): PeriodState {
  if (!value) return { isClosed: false, from: '8:00', to: '20:00' };
  if (value === CLOSED) return { isClosed: true, from: '8:00', to: '20:00' };
  const [from, to] = value.split(' - ');
  return { isClosed: false, from: from || '8:00', to: to || '20:00' };
}

function formatPeriod(p: PeriodState): string {
  if (p.isClosed) return CLOSED;
  return `${p.from} - ${p.to}`;
}

// ── Component chọn giờ cho một khung ──────────────────────────────────
function PeriodPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: PeriodState;
  onChange: (v: PeriodState) => void;
}) {
  const selectClass =
    'flex-1 h-9 px-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all';

  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      {/* Header row: label + toggle */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-800/60">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 text-xs font-medium">
          <button
            type="button"
            onClick={() => onChange({ ...value, isClosed: false })}
            className={`px-3 py-1.5 transition-colors ${
              !value.isClosed
                ? 'bg-primary-500 text-white'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-white dark:bg-gray-900'
            }`}
          >
            Mở cửa
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...value, isClosed: true })}
            className={`px-3 py-1.5 transition-colors border-l border-gray-200 dark:border-gray-700 ${
              value.isClosed
                ? 'bg-red-500 text-white'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-white dark:bg-gray-900'
            }`}
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Time selectors — chỉ hiện khi mở */}
      {!value.isClosed && (
        <div className="flex items-center gap-2 px-3 py-2.5">
          <select
            value={value.from}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
            className={selectClass}
          >
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <span className="text-gray-400 text-sm select-none">→</span>
          <select
            value={value.to}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            className={selectClass}
          >
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      )}

      {/* Closed indicator */}
      {value.isClosed && (
        <div className="px-3 py-2 text-xs text-red-400 font-medium">
          Không hoạt động vào ngày này
        </div>
      )}
    </div>
  );
}

// ── Hiển thị giá trị giờ trong view mode ──────────────────────────────
function HoursDisplay({ value }: { value?: string }) {
  if (!value) return <span className="text-xs text-gray-400 italic">Chưa cập nhật</span>;
  if (value === CLOSED)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
        Đóng cửa
      </span>
    );
  return <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</span>;
}

// ── Schema form (chỉ name/address/phone — giờ dùng local state) ────────
const schema = z.object({
  name: z.string().min(2, 'Tên tiệm ít nhất 2 ký tự').max(50),
  address: z.string().optional(),
  phone: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

// ──────────────────────────────────────────────────────────────────────
export default function OwnerShopPage() {
  const { user, shop, refreshUser } = useAuth();
  const hasShop = !!user?.shopId && !!shop;

  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [periods, setPeriods] = useState({
    weekday: parsePeriod(shop?.openingHours),
    weekend: parsePeriod(shop?.weekendHours),
    holiday: parsePeriod(shop?.holidayHours),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: shop?.name || '', address: shop?.address || '', phone: shop?.phone || '' },
  });

  const startEditing = () => {
    reset({ name: shop?.name || '', address: shop?.address || '', phone: shop?.phone || '' });
    setPeriods({
      weekday: parsePeriod(shop?.openingHours),
      weekend: parsePeriod(shop?.weekendHours),
      holiday: parsePeriod(shop?.holidayHours),
    });
    setEditing(true);
  };

  const onSubmit = async (data: FormData) => {
    if (!shop) return;
    setSubmitting(true);
    try {
      await updateShop(shop.id, {
        name: data.name,
        address: data.address || '',
        phone: data.phone || '',
        openingHours: formatPeriod(periods.weekday),
        weekendHours: formatPeriod(periods.weekend),
        holidayHours: formatPeriod(periods.holiday),
      });
      toast.success('Đã cập nhật thông tin tiệm!');
      setEditing(false);
      await refreshUser();
    } catch {
      toast.error('Không thể lưu. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Header title="Tiệm của tôi" />

      <div className="p-4 md:p-6 space-y-5 max-w-5xl">
        {!hasShop ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center py-16 text-center"
          >
            <div className="h-20 w-20 rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shadow-sm mb-4">
              <Hourglass size={36} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Chưa có tiệm</h2>
            <p className="text-sm text-gray-400 max-w-xs">
              Tài khoản của bạn chưa được phân bổ tiệm. Vui lòng liên hệ Super Admin để được gán tiệm.
            </p>
          </motion.div>
        ) : (
          <>
            {/* Banner */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl bg-gradient-primary p-6 text-white shadow-glass-lg"
            >
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Store size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold truncate">{shop.name}</p>
                </div>
              </div>
            </motion.div>

            {/* Card thông tin */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Thông tin tiệm</h3>
                  {!editing && (
                    <button
                      onClick={startEditing}
                      className="flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 font-medium"
                    >
                      <Pencil size={13} /> Chỉnh sửa
                    </button>
                  )}
                </div>

                {editing ? (
                  /* ── Edit mode ── */
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                    <Input label="Tên tiệm" error={errors.name?.message} {...register('name')} />
                    <Input label="Địa chỉ" placeholder="123 Đường ABC, Quận 1, TP.HCM" {...register('address')} />
                    <Input label="Điện thoại" placeholder="0901234567" type="tel" {...register('phone')} />

                    <div className="pt-1 space-y-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Giờ mở cửa</p>
                      <PeriodPicker
                        label="Thứ 2 – Thứ 6"
                        value={periods.weekday}
                        onChange={(v) => setPeriods((p) => ({ ...p, weekday: v }))}
                      />
                      <PeriodPicker
                        label="Thứ 7 – Chủ nhật"
                        value={periods.weekend}
                        onChange={(v) => setPeriods((p) => ({ ...p, weekend: v }))}
                      />
                      <PeriodPicker
                        label="Ngày lễ"
                        value={periods.holiday}
                        onChange={(v) => setPeriods((p) => ({ ...p, holiday: v }))}
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" fullWidth type="button" onClick={() => setEditing(false)}>Hủy</Button>
                      <Button fullWidth type="submit" loading={submitting}>
                        <Check size={16} /> Lưu
                      </Button>
                    </div>
                  </form>
                ) : (
                  /* ── View mode ── */
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <Store size={15} className="text-primary-400 flex-shrink-0" />
                      <span className="flex-1">Tên tiệm</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{shop.name}</span>
                    </div>
                    <div className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
                      <MapPin size={15} className="text-primary-400 flex-shrink-0 mt-0.5" />
                      <span className="flex-1">Địa chỉ</span>
                      {shop.address
                        ? <span className="font-medium text-gray-900 dark:text-gray-100 text-right max-w-[55%]">{shop.address}</span>
                        : <span className="text-gray-400 italic">Chưa cập nhật</span>
                      }
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <Phone size={15} className="text-primary-400 flex-shrink-0" />
                      <span className="flex-1">Điện thoại</span>
                      {shop.phone
                        ? <span className="font-medium text-gray-900 dark:text-gray-100">{shop.phone}</span>
                        : <span className="text-gray-400 italic">Chưa cập nhật</span>
                      }
                    </div>

                    {/* Giờ mở cửa */}
                    <div className="pt-1">
                      <div className="flex items-center gap-2 mb-2.5">
                        <Clock size={15} className="text-primary-400 flex-shrink-0" />
                        <span className="font-medium text-gray-600 dark:text-gray-400">Giờ mở cửa</span>
                      </div>
                      <div className="ml-5 rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2.5">
                          <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <CalendarDays size={12} /> T2 – T6
                          </span>
                          <HoursDisplay value={shop.openingHours || undefined} />
                        </div>
                        <div className="flex items-center justify-between px-3 py-2.5">
                          <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <CalendarDays size={12} /> T7 – CN
                          </span>
                          <HoursDisplay value={shop.weekendHours || undefined} />
                        </div>
                        <div className="flex items-center justify-between px-3 py-2.5">
                          <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <CalendarOff size={12} /> Ngày lễ
                          </span>
                          <HoursDisplay value={shop.holidayHours || undefined} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
