import { doc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Génère le prochain numéro de proforma
 * Format : CR2026-PR-001
 */
export async function getNextProformaNumber(): Promise<string> {
  const year = new Date().getFullYear();

  const counterRef = doc(db, 'counters', `proforma_${year}`);

  const nextNumber = await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);

    if (!counterDoc.exists()) {
      transaction.set(counterRef, {
        current: 1,
        year,
        prefix: `CR${year}-PR`,
      });

      return 1;
    }

    const current = counterDoc.data()?.current ?? 0;
    const next = current + 1;

    transaction.update(counterRef, {
      current: next,
    });

    return next;
  });

  const padded = nextNumber.toString().padStart(3, '0');

  return `CR${year}-PR-${padded}`;
}