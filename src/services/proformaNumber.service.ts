//src/services/proformaNumber.service.ts
import { doc, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function getNextProformaNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const ref = doc(db, "counters", `proforma_${year}`);

  const next = await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);

    const current = snap.exists()
      ? Number(snap.data()?.current ?? snap.data()?.value ?? 0)
      : 0;

    const nextValue = current + 1;

    transaction.set(
      ref,
      {
        current: nextValue,
        value: nextValue, // compat ancien système
        year,
        prefix: `CR${year}-PR`,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return nextValue;
  });

  return `CR${year}-PR-${String(next).padStart(3, "0")}`;
}