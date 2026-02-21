import {
  collection,
  writeBatch,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { v4 as uuidv4 } from "uuid";

interface DistributeDividendInput {
  amount: number;
  sourceAccountId: string; // compte Crepolia
  targetAccountId: string; // compte Maison
}

export async function distributeDividend(
  input: DistributeDividendInput
) {
  if (input.amount <= 0) {
    throw new Error("Montant invalide");
  }

  const batch = writeBatch(db);
  const transferId = uuidv4();

  const sourceRef = doc(collection(db, "finance_transactions"));
  const targetRef = doc(collection(db, "finance_transactions"));

  const now = Timestamp.now();

  // 🔻 Dépense Crepolia
  batch.set(sourceRef, {
    entity: "crepolia",
    type: "expense",
    amount: input.amount,
    currency: "USD",
    date: now,
    accountId: input.sourceAccountId,
    category: "dividend",
    description: "Dividende distribué",
    isInternalTransfer: true,
    transferId,
    internalTargetEntity: "maison",
    createdAt: now,
  });

  // 🔺 Entrée Maison
  batch.set(targetRef, {
    entity: "maison",
    type: "income",
    amount: input.amount,
    currency: "USD",
    date: now,
    accountId: input.targetAccountId,
    category: "dividend",
    description: "Dividende reçu",
    isInternalTransfer: true,
    transferId,
    internalTargetEntity: "crepolia",
    createdAt: now,
  });

  await batch.commit();
}