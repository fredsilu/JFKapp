import { doc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function getNextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const ref = doc(db, 'counters', `invoice_${year}`);

  return await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);

    let next = 1;

    if (snap.exists()) {
      next = (snap.data().value || 0) + 1;
    }

    transaction.set(ref, { value: next });

    return `CR${year}-FC-${String(next).padStart(3, '0')}`;
  });
}