'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Square, Check, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useServices } from '@/hooks/useServices';
import { createTransaction } from '@/services/transaction.service';
import Header from '@/components/layout/Header';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';
import { Service } from '@/types';

const schema = z.object({
  customerName: z.string().min(1, 'Vui lòng nhập tên khách'),
  customerPhone: z.string().optional(),
  serviceIds: z.array(z.string()).min(1, 'Vui lòng chọn ít nhất 1 dịch vụ'),
  totalAmount: z.coerce.number().min(1, 'Doanh thu phải lớn hơn 0'),
  note: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function StaffNewTransactionPage() {
  const { user } = useAuth();
  const { activeServices, loading: servicesLoading } = useServices(user?.shopId);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { serviceIds: [], note: '', customerPhone: '' },
  });

  const selectedServiceIds = watch('serviceIds');

  const toggleService = (service: Service, currentIds: string[], onChange: (ids: string[]) => void) => {
    const newIds = currentIds.includes(service.id)
      ? currentIds.filter((id) => id !== service.id)
      : [...currentIds, service.id];
    onChange(newIds);
    const newTotal = activeServices
      .filter((s) => newIds.includes(s.id))
      .reduce((sum, s) => sum + s.price, 0);
    setValue('totalAmount', newTotal);
  };

  const onSubmit = async (data: FormData) => {
    if (!user?.shopId || !user?.id) return;
    setSubmitting(true);
    try {
      const serviceNames = activeServices
        .filter((s) => data.serviceIds.includes(s.id))
        .map((s) => s.name);

      await createTransaction(user.shopId, user.id, user.name, {
        ...data,
        serviceNames,
        note: data.note || '',
        suggestedAmount: data.totalAmount,
        discount: 0,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        reset({ serviceIds: [], note: '', customerPhone: '', customerName: '', totalAmount: 0 });
      }, 2000);

      toast.success('Lưu giao dịch thành công!');
    } catch {
      toast.error('Không thể lưu giao dịch');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Header title="Giao dịch mới" subtitle="Nhập thông tin khách hàng" />

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 flex flex-col items-center gap-4 mx-6 shadow-2xl">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-mint-400 to-emerald-400 flex items-center justify-center">
                <Check size={40} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Đã lưu!</h3>
              <p className="text-gray-400 text-sm text-center">Giao dịch đã được ghi nhận thành công</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-6 space-y-5 max-w-5xl">
        {/* Customer Info */}
        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Thông tin khách</h3>
          <div className="space-y-4">
            <Input
              label="Tên khách *"
              placeholder="Nguyễn Thị A"
              error={errors.customerName?.message}
              {...register('customerName')}
            />
            <Input
              label="Số điện thoại"
              placeholder="0901234567"
              type="tel"
              {...register('customerPhone')}
            />
          </div>
        </Card>

        {/* Services */}
        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Dịch vụ *</h3>
          {errors.serviceIds && (
            <p className="text-xs text-red-500 mb-3">{errors.serviceIds.message}</p>
          )}
          <Controller
            name="serviceIds"
            control={control}
            render={({ field: { value, onChange } }) => (
              <div className="grid grid-cols-1 gap-2 mt-3">
                {servicesLoading ? (
                  <p className="text-sm text-gray-400">Đang tải...</p>
                ) : activeServices.length === 0 ? (
                  <p className="text-sm text-gray-400">Chưa có dịch vụ. Liên hệ chủ tiệm.</p>
                ) : (
                  activeServices.map((service) => {
                    const isSelected = value.includes(service.id);
                    return (
                      <motion.button
                        key={service.id}
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleService(service, value, onChange)}
                        className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left ${
                          isSelected
                            ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                        }`}
                      >
                        <div className={`flex-shrink-0 ${isSelected ? 'text-primary-500' : 'text-gray-300'}`}>
                          {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                        </div>
                        <span className={`flex-1 text-sm font-medium ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'}`}>
                          {service.name}
                        </span>
                        <span className={`text-sm font-semibold flex-shrink-0 ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`}>
                          {formatCurrency(service.price)}
                        </span>
                      </motion.button>
                    );
                  })
                )}
              </div>
            )}
          />
        </Card>

        {/* Amount */}
        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Doanh thu</h3>
          <Input
            label="Số tiền (€) *"
            type="number"
            placeholder="150"
            error={errors.totalAmount?.message}
            {...register('totalAmount')}
          />
        </Card>

        {/* Note */}
        <Card>
          <Textarea
            label="Ghi chú"
            placeholder="Ghi chú thêm (tùy chọn)..."
            {...register('note')}
          />
        </Card>

        <Button type="submit" fullWidth size="lg" loading={submitting}>
          <Sparkles size={18} />
          Lưu giao dịch
        </Button>
      </form>
    </div>
  );
}

