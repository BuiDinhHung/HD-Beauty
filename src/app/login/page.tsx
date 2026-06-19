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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'super_admin') router.replace('/super-admin/dashboard');
      else if (user.role === 'owner' || user.role === 'manager') router.replace('/owner/dashboard');
      else router.replace('/staff/home');
    }
  }, [user, loading, router]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      await loginWithEmail(data.email, data.password);
      toast.success('Đăng nhập thành công!');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        toast.error('Email hoặc mật khẩu không đúng');
      } else if (code === 'auth/too-many-requests') {
        toast.error('Quá nhiều lần thử. Vui lòng thử lại sau.');
      } else {
        toast.error('Đã có lỗi xảy ra');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen min-h-dvh bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
            className="inline-flex items-center justify-center mb-2"
          >
            <Image src="/logo_ngang.png" alt="HD Beauty Manager" width={300} height={76} className="drop-shadow-2xl" priority />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-glass border border-gray-100 dark:border-gray-800 p-6 space-y-4"
        >
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
            <div>
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
            </div>
            <Button type="submit" fullWidth size="lg" loading={submitting}>
              Đăng nhập
            </Button>
          </form>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-gray-400 mt-6"
        >
          Copyright © {new Date().getFullYear()} Hoangcaster
        </motion.p>
      </div>
    </div>
  );
}
