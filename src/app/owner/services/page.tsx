'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Scissors } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useServices } from '@/hooks/useServices';
import {
  createService,
  updateService,
  deleteService,
  toggleServiceActive,
} from '@/services/service.service';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ServiceCard from '@/components/shared/ServiceCard';
import SearchBar from '@/components/ui/SearchBar';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/Loading';
import { Service } from '@/types';

const schema = z.object({
  name: z.string().min(2, 'Tên ít nhất 2 ký tự'),
  price: z.coerce.number().min(1, 'Giá phải lớn hơn 0'),
  active: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

export default function ServicesPage() {
  const { user } = useAuth();
  const { services, loading } = useServices(user?.shopId);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Service | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { active: true } });

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditTarget(null);
    reset({ name: '', price: 0, active: true });
    setModalOpen(true);
  };

  const openEdit = (service: Service) => {
    setEditTarget(service);
    reset({ name: service.name, price: service.price, active: service.active });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    if (!user?.shopId) return;
    setSubmitting(true);
    try {
      if (editTarget) {
        await updateService(editTarget.id, data);
        toast.success('Cập nhật dịch vụ thành công!');
      } else {
        await createService(user.shopId, data);
        toast.success('Thêm dịch vụ thành công!');
      }
      setModalOpen(false);
    } catch {
      toast.error('Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      await deleteService(editTarget.id);
      toast.success('Đã xóa dịch vụ');
      setDeleteOpen(false);
    } catch {
      toast.error('Không thể xóa');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (service: Service) => {
    try {
      await toggleServiceActive(service.id, !service.active);
      toast.success(service.active ? 'Đã ẩn dịch vụ' : 'Đã hiện dịch vụ');
    } catch {
      toast.error('Không thể thực hiện');
    }
  };

  return (
    <div>
      <Header
        title="Dịch vụ"
        subtitle={`${services.length} dịch vụ`}
        rightAction={
          <Button size="icon" onClick={openAdd}>
            <Plus size={18} />
          </Button>
        }
      />

      <div className="p-4 md:p-6 space-y-4 max-w-5xl">
        <SearchBar
          placeholder="Tìm dịch vụ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
        />

        {loading ? (
          <SkeletonList count={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Scissors size={36} />}
            title={search ? 'Không tìm thấy' : 'Chưa có dịch vụ'}
            description={search ? 'Thử tìm kiếm khác' : 'Thêm dịch vụ để nhân viên chọn khi nhập giao dịch'}
            action={!search && <Button onClick={openAdd}><Plus size={16} /> Thêm dịch vụ</Button>}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((s, i) => (
              <ServiceCard
                key={s.id}
                service={s}
                index={i}
                onEdit={() => openEdit(s)}
                onDelete={() => { setEditTarget(s); setDeleteOpen(true); }}
                onToggleActive={() => handleToggle(s)}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Tên dịch vụ"
            placeholder="VD: Nail gel, Massage, ..."
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Giá (€)"
            type="number"
            placeholder="150"
            error={errors.price?.message}
            {...register('price')}
          />
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded accent-primary-500"
              {...register('active')}
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Hoạt động</span>
          </label>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth type="button" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button fullWidth type="submit" loading={submitting}>
              {editTarget ? 'Lưu' : 'Thêm'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Xóa dịch vụ"
        description={`Bạn có chắc muốn xóa dịch vụ "${editTarget?.name}"?`}
        confirmLabel="Xóa"
        loading={submitting}
      />
    </div>
  );
}

