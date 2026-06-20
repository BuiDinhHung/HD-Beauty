import {
  doc,
  getDoc,
  getDocs,
  collection,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Shop } from '@/types';

export async function updateShop(shopId: string, data: Partial<Pick<Shop, 'name' | 'address' | 'phone' | 'scheduleJson'>>) {
  await updateDoc(doc(db, 'shops', shopId), data);
}

export async function getShopById(shopId: string): Promise<Shop | null> {
  const snap = await getDoc(doc(db, 'shops', shopId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Shop;
}

export async function getAllShops(): Promise<Shop[]> {
  const snap = await getDocs(collection(db, 'shops'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Shop));
}
