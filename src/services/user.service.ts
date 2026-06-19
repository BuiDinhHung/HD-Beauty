import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function updateUserProfile(userId: string, data: { name?: string; phone?: string; photoURL?: string }) {
  await updateDoc(doc(db, 'users', userId), data);
}

// Resize + compress ảnh thành JPEG base64, lưu thẳng vào Firestore — không cần Firebase Storage
export async function uploadAvatar(_userId: string, file: File): Promise<string> {
  if (file.size > 10 * 1024 * 1024) throw new Error('Ảnh tối đa 10MB');

  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const MAX = 200;
      const scale = Math.min(MAX / img.width, MAX / img.height, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      URL.revokeObjectURL(img.src);
      resolve(dataUrl);
    };
    img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error('Không đọc được ảnh')); };
    img.src = URL.createObjectURL(file);
  });
}
