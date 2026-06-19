import {
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Shop } from '@/types';

export async function updateShop(shopId: string, data: Partial<Pick<Shop, 'name'>>) {
  await updateDoc(doc(db, 'shops', shopId), data);
}
