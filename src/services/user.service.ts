import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

export async function updateUserProfile(userId: string, data: { name?: string; phone?: string; photoURL?: string }) {
  await updateDoc(doc(db, 'users', userId), data);
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  // Giới hạn 5MB
  if (file.size > 5 * 1024 * 1024) throw new Error('Ảnh tối đa 5MB');

  const ext = file.name.split('.').pop() ?? 'jpg';
  const storageRef = ref(storage, `avatars/${userId}/avatar.${ext}`);
  const snapshot = await uploadBytes(storageRef, file, { contentType: file.type });
  return await getDownloadURL(snapshot.ref);
}

export async function deleteAvatar(userId: string, ext = 'jpg') {
  try {
    await deleteObject(ref(storage, `avatars/${userId}/avatar.${ext}`));
  } catch {
    // ignore if not found
  }
}
