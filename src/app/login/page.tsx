'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { loginWithEmail } from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [postLoginPending, setPostLoginPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (loading) return;
    if (user) {
      if (postLoginPending) {
        toast.success('Đăng nhập thành công!');
        setPostLoginPending(false);
      }
      if (user.role === 'super_admin') router.replace('/super-admin/dashboard');
      else if (user.role === 'owner' || user.role === 'manager') router.replace('/owner/dashboard');
      else router.replace('/staff/home');
    } else if (postLoginPending) {
      // Firebase Auth OK nhưng tài khoản bị khóa hoặc không tồn tại trong hệ thống
      toast.error('Tài khoản bị khóa hoặc không hợp lệ. Liên hệ admin.');
      setPostLoginPending(false);
      setSubmitting(false);
    }
  }, [loading, postLoginPending, user, router]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      await loginWithEmail(data.email, data.password);
      setPostLoginPending(true);
      // Không reset submitting ở đây — giữ loading state cho đến khi AuthContext xác nhận
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        toast.error('Email hoặc mật khẩu không đúng');
      } else if (code === 'auth/too-many-requests') {
        toast.error('Quá nhiều lần thử. Vui lòng thử lại sau.');
      } else {
        toast.error('Đã có lỗi xảy ra');
      }
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen min-h-dvh bg-gradient-to-br from-primary-500 via-primary-400 to-secondary-400 flex items-center justify-center p-4 relative overflow-hidden">
      {/* decorative circles */}
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10" />
      <div className="absolute -bottom-12 -left-12 w-52 h-52 rounded-full bg-white/10" />

      {/* Card chứa toàn bộ nội dung */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 space-y-6"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
          className="flex flex-col items-center gap-1"
        >
          <Image
            src="/logo_ngang.png"
            alt="HD Beauty Manager"
            width={240}
            height={62}
            className="drop-shadow-md"
            priority
          />
          <p className="text-xs text-gray-400 tracking-widest uppercase font-medium mt-1">
            Quản lý tiệm làm đẹp
          </p>
        </motion.div>

        <div className="h-px bg-gray-100 dark:bg-gray-800" />

        {/* Form */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Đăng nhập</h2>
            <p className="text-sm text-gray-400">Nhập thông tin tài khoản của bạn</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="your@email.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Mật khẩu"
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
              error={errors.password?.message}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              {...register('password')}
            />
            <Button type="submit" fullWidth size="lg" loading={submitting}>
              Đăng nhập
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-300 dark:text-gray-600 pt-2">
          Copyright © {new Date().getFullYear()} Hoangcaster
        </p>
      </motion.div>
    </div>
  );
}
