import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

export async function updateUserProfile(userId: string, data: { name?: string; phone?: string; photoURL?: string }) {
  await updateDoc(doc(db, 'users', userId), data);
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (file.size > 5 * 1024 * 1024) throw new Error('Ảnh tối đa 5MB');

  const ext = file.name.split('.').pop() ?? 'jpg';
  const storageRef = ref(storage, `avatars/${userId}/avatar.${ext}`);

  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Upload quá thời gian — kiểm tra Firebase Storage đã bật chưa')),
      20000,
    );

    const task = uploadBytesResumable(storageRef, file, { contentType: file.type });
    task.on(
      'state_changed',
      null,
      (err) => { clearTimeout(timer); reject(err); },
      async () => {
        clearTimeout(timer);
        try { resolve(await getDownloadURL(task.snapshot.ref)); }
        catch (e) { reject(e); }
      },
    );
  });
}

export async function deleteAvatar(userId: string, ext = 'jpg') {
  try {
    await deleteObject(ref(storage, `avatars/${userId}/avatar.${ext}`));
  } catch {
    // ignore if not found
  }
}
