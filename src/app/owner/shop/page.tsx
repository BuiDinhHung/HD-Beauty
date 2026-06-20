'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Store, Pencil, Check, MapPin, Phone, Clock, Hourglass, CalendarOff, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { updateShop } from '@/services/shop.service';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const HOURS_OPTIONS = [
  '6:00 - 17:00',
  '6:00 - 18:00',
  '7:00 - 17:00',
  '7:00 - 18:00',
  '7:00 - 19:00',
  '7:00 - 20:00',
  '8:00 - 17:00',
  '8:00 - 18:00',
  '8:00 - 19:00',
  '8:00 - 20:00',
  '8:00 - 21:00',
  '9:00 - 18:00',
  '9:00 - 19:00',
  '9:00 - 20:00',
  '9:00 - 21:00',
  '10:00 - 20:00',
  '10:00 - 21:00',
  '10:00 - 22:00',
];

const CLOSED = 'Đóng cửa';

const schema = z.object({
  name: z.string().min(2, 'Tên tiệm ít nhất 2 ký tự').max(50),
  address: z.string().optional(),
  phone: z.string().optional(),
  openingHours: z.string().optional(),
  weekendHours: z.string().optional(),
  holidayHours: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function HoursSelect({ label, value, onChange }: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all duration-200"
      >
        <option value="">-- Chưa cập nhật --</option>
        <option value={CLOSED}>🔴 Đóng cửa</option>
        {HOURS_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function HoursValue({ value }: { value?: string }) {
  if (!value) return <span className="text-gray-400 italic">Chưa cập nhật</span>;
  if (value === CLOSED) return <span className="text-red-400 font-medium">Đóng cửa</span>;
  return <span className="font-medium text-gray-900 dark:text-gray-100">{value}</span>;
}

export default function OwnerShopPage() {
  const { user, shop, refreshUser } = useAuth();
  const hasShop = !!user?.shopId && !!shop;

  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: shop?.name || '',
      address: shop?.address || '',
      phone: shop?.phone || '',
      openingHours: shop?.openingHours || '',
      weekendHours: shop?.weekendHours || '',
      holidayHours: shop?.holidayHours || '',
    },
  });

  const openingHours = watch('openingHours');
  const weekendHours = watch('weekendHours');
  const holidayHours = watch('holidayHours');

  const onSubmit = async (data: FormData) => {
    if (!shop) return;
    setSubmitting(true);
    try {
      await updateShop(shop.id, {
        name: data.name,
        address: data.address || '',
        phone: data.phone || '',
        openingHours: data.openingHours || '',
        weekendHours: data.weekendHours || '',
        holidayHours: data.holidayHours || '',
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

  const startEditing = () => {
    reset({
      name: shop?.name || '',
      address: shop?.address || '',
      phone: shop?.phone || '',
      openingHours: shop?.openingHours || '',
      weekendHours: shop?.weekendHours || '',
      holidayHours: shop?.holidayHours || '',
    });
    setEditing(true);
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

            {/* Thông tin tiệm */}
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
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                    <Input label="Tên tiệm" error={errors.name?.message} {...register('name')} />
                    <Input label="Địa chỉ" placeholder="123 Đường ABC, Quận 1, TP.HCM" {...register('address')} />
                    <Input label="Điện thoại" placeholder="0901234567" type="tel" {...register('phone')} />

                    {/* Giờ mở cửa */}
                    <div className="pt-1">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2.5">Giờ mở cửa</p>
                      <div className="space-y-2 pl-1">
                        <HoursSelect
                          label="Thứ 2 – Thứ 6"
                          value={openingHours}
                          onChange={(v) => setValue('openingHours', v)}
                        />
                        <HoursSelect
                          label="Thứ 7 – Chủ nhật"
                          value={weekendHours}
                          onChange={(v) => setValue('weekendHours', v)}
                        />
                        <HoursSelect
                          label="Ngày lễ"
                          value={holidayHours}
                          onChange={(v) => setValue('holidayHours', v)}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" fullWidth type="button" onClick={() => setEditing(false)}>Hủy</Button>
                      <Button fullWidth type="submit" loading={submitting}>
                        <Check size={16} /> Lưu
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <Store size={15} className="text-primary-400 flex-shrink-0" />
                      <span className="flex-1">Tên tiệm</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{shop.name}</span>
                    </div>
                    <div className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
                      <MapPin size={15} className="text-primary-400 flex-shrink-0 mt-0.5" />
                      <span className="flex-1">Địa chỉ</span>
                      <span className={`text-right max-w-[55%] ${shop.address ? 'font-medium text-gray-900 dark:text-gray-100' : ''}`}>
                        {shop.address || <span className="text-gray-400 italic">Chưa cập nhật</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <Phone size={15} className="text-primary-400 flex-shrink-0" />
                      <span className="flex-1">Điện thoại</span>
                      <HoursValue value={shop.phone || undefined} />
                    </div>

                    {/* Giờ mở cửa block */}
                    <div className="pt-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={15} className="text-primary-400 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Giờ mở cửa</span>
                      </div>
                      <div className="ml-6 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                            <CalendarDays size={13} /> T2 – T6
                          </span>
                          <HoursValue value={shop.openingHours || undefined} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                            <CalendarDays size={13} /> T7 – CN
                          </span>
                          <HoursValue value={shop.weekendHours || undefined} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                            <CalendarOff size={13} /> Ngày lễ
                          </span>
                          <HoursValue value={shop.holidayHours || undefined} />
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
