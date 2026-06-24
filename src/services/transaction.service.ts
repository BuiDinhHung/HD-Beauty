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
import { Transaction, TransactionFormData } from '@/types';

export async function createTransaction(
  shopId: string,
  staffId: string,
  staffName: string,
  data: TransactionFormData,
  date?: Date
): Promise<string> {
  const ref = await addDoc(collection(db, 'transactions'), {
    shopId,
    staffId,
    staffName,
    totalAmount: data.totalAmount,
    createdAt: date ? Timestamp.fromDate(date) : Timestamp.now(),
  });
  return ref.id;
}

export function subscribeTransactions(
  shopId: string,
  callback: (transactions: Transaction[]) => void,
) {
  const q = query(collection(db, 'transactions'), where('shopId', '==', shopId));
  return onSnapshot(
    q,
    (snap) => {
      const sorted = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Transaction)
        .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
      callback(sorted);
    },
    (err) => { console.error('[subscribeTransactions]', err); callback([]); },
  );
}

export function subscribeStaffTransactions(
  shopId: string,
  staffId: string,
  callback: (transactions: Transaction[]) => void,
) {
  const q = query(
    collection(db, 'transactions'),
    where('shopId', '==', shopId),
    where('staffId', '==', staffId),
  );
  return onSnapshot(
    q,
    (snap) => {
      const sorted = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Transaction)
        .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
      callback(sorted);
    },
    (err) => { console.error('[subscribeStaffTransactions]', err); callback([]); },
  );
}

export async function updateTransaction(
  transactionId: string,
  data: { totalAmount: number; staffId?: string; staffName?: string; date?: Date }
): Promise<void> {
  const updates: Record<string, unknown> = { totalAmount: data.totalAmount };
  if (data.staffId)   updates.staffId   = data.staffId;
  if (data.staffName) updates.staffName = data.staffName;
  if (data.date)      updates.createdAt = Timestamp.fromDate(data.date);
  await updateDoc(doc(db, 'transactions', transactionId), updates);
}

export async function deleteTransaction(transactionId: string) {
  await deleteDoc(doc(db, 'transactions', transactionId));
}
