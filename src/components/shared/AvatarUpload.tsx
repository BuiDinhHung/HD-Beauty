'use client';

import { useRef, useState, useEffect } from 'react';
import { Camera } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { uploadAvatar, updateUserProfile } from '@/services/user.service';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  userId: string;
  photoURL?: string;
  initials: string;
  size?: 'md' | 'lg';
}

export default function AvatarUpload({ userId, photoURL, initials, size = 'lg' }: Props) {
  const { refreshUser } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(photoURL);

  // Sync khi prop photoURL thay đổi từ bên ngoài (vd: sau refreshUser)
  useEffect(() => { setPreview(photoURL); }, [photoURL]);

  const dim = size === 'lg' ? 'h-20 w-20' : 'h-12 w-12';
  const text = size === 'lg' ? 'text-3xl' : 'text-lg';
  const iconSize = size === 'lg' ? 12 : 10;
  const btnSize = size === 'lg' ? 'h-7 w-7' : 'h-5 w-5';

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }

    // Preview tức thì
    const blobUrl = URL.createObjectURL(file);
    setPreview(blobUrl);
    setUploading(true);

    try {
      const url = await uploadAvatar(userId, file);
      await updateUserProfile(userId, { photoURL: url });
      await refreshUser();
      setPreview(url);
      toast.success('Cập nhật ảnh thành công!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      toast.error(msg || 'Không thể upload ảnh');
      setPreview(photoURL);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(blobUrl);
      // Reset input để có thể chọn lại cùng file
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="relative inline-block">
      {/* Avatar circle */}
      <div
        className={`${dim} rounded-full bg-gradient-primary flex items-center justify-center text-white ${text} font-bold shadow-glass-lg overflow-hidden`}
      >
        {preview ? (
          <Image
            src={preview}
            alt="Avatar"
            width={80}
            height={80}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {/* Camera button */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={`absolute bottom-0 right-0 ${btnSize} rounded-full bg-white dark:bg-gray-800 border-2 border-white dark:border-gray-700 shadow-md flex items-center justify-center text-primary-500 hover:bg-primary-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-60`}
      >
        {uploading ? (
          <div className="h-3 w-3 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Camera size={iconSize} />
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
