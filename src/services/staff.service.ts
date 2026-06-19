import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types';

export function subscribeStaffList(
  shopId: string,
  callback: (staff: User[]) => void,
  onError?: (err: Error) => void,
) {
  const q = query(
    collection(db, 'users'),
    where('shopId', '==', shopId),
    where('role', 'in', ['staff', 'manager']),
  );
  return onSnapshot(
    q,
    (snap) => {
      const sorted = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as User)
        .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
      callback(sorted);
    },
    (err) => {
      console.error('subscribeStaffList error:', err);
      onError?.(err);
      callback([]);
    },
  );
}

export async function updateStaff(staffId: string, data: Partial<User>) {
  await updateDoc(doc(db, 'users', staffId), { ...data });
}

export async function toggleStaffActive(staffId: string, active: boolean) {
  await updateDoc(doc(db, 'users', staffId), { active });
}

export async function deleteStaff(staffId: string) {
  await deleteDoc(doc(db, 'users', staffId));
}

export async function transferStaff(staffId: string, newShopId: string) {
  await updateDoc(doc(db, 'users', staffId), { shopId: newShopId });
}
