import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Service, ServiceFormData } from '@/types';

export function subscribeServices(
  shopId: string,
  callback: (services: Service[]) => void,
  onError?: (err: Error) => void,
) {
  const q = query(collection(db, 'services'), where('shopId', '==', shopId));
  return onSnapshot(
    q,
    (snap) => {
      const sorted = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Service)
        .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
      callback(sorted);
    },
    (err) => {
      console.error('subscribeServices error:', err);
      onError?.(err);
      callback([]);
    },
  );
}

export async function createService(shopId: string, data: ServiceFormData): Promise<string> {
  const ref = await addDoc(collection(db, 'services'), {
    shopId,
    name: data.name,
    price: data.price,
    active: data.active,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function updateService(serviceId: string, data: Partial<ServiceFormData>) {
  await updateDoc(doc(db, 'services', serviceId), { ...data });
}

export async function deleteService(serviceId: string) {
  await deleteDoc(doc(db, 'services', serviceId));
}

export async function toggleServiceActive(serviceId: string, active: boolean) {
  await updateDoc(doc(db, 'services', serviceId), { active });
}
