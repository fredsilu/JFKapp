import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  Timestamp,
  writeBatch,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { v4 as uuidv4 } from "uuid";

import {
  Transaction,
  InternalTransferInput,
} from "@/types/finance.types";

/* ============================= */
/*       COLLECTION REF          */
/* ============================= */

const getTransactionsCollection = (entity: string) =>
  collection(db, "finance", entity, "transactions");

/* ============================= */
/*       CREATE TRANSACTION      */
/* ============================= */

export async function createTransaction(
  entity: "maison" | "crepolia",
  transaction: Omit<Transaction, "id" | "createdAt" | "entity">
) {
  const docRef = await addDoc(getTransactionsCollection(entity), {
    ...transaction,
    date: Timestamp.fromDate(transaction.date),
    createdAt: Timestamp.now(),
  });

  return docRef.id;
}

/* ============================= */
/*       GET BY ENTITY           */
/* ============================= */

export async function getTransactionsByEntity(entity: string) {
  const q = query(
    getTransactionsCollection(entity),
    orderBy("date", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();

    return {
      id: docSnap.id,
      ...data,
      date: data.date?.toDate(),
      createdAt: data.createdAt?.toDate(),
    };
  }) as Transaction[];
}

/* ============================= */
/*       INTERNAL TRANSFER       */
/* ============================= */

export async function createInternalTransfer(
  input: InternalTransferInput
) {
  const batch = writeBatch(db);
  const transferId = uuidv4();

  const sourceRef = doc(getTransactionsCollection(input.sourceEntity));
  const targetRef = doc(getTransactionsCollection(input.targetEntity));

  batch.set(sourceRef, {
    type: "expense",
    amount: input.amount,
    currency: input.currency,
    date: Timestamp.fromDate(input.date),
    accountId: input.sourceAccountId,
    category: "internal_transfer",
    description: input.description || "Transfert interne",
    isInternalTransfer: true,
    transferId,
    createdAt: Timestamp.now(),
  });

  batch.set(targetRef, {
    type: "income",
    amount: input.amount,
    currency: input.currency,
    date: Timestamp.fromDate(input.date),
    accountId: input.targetAccountId,
    category: "internal_transfer",
    description: input.description || "Transfert interne",
    isInternalTransfer: true,
    transferId,
    createdAt: Timestamp.now(),
  });

  await batch.commit();
}

/* ============================= */
/*    DELETE INTERNAL TRANSFER   */
/* ============================= */

export async function deleteInternalTransfer(
  entity: string,
  transferId: string
) {
  const q = query(
    getTransactionsCollection(entity),
    where("transferId", "==", transferId)
  );

  const snapshot = await getDocs(q);
  const batch = writeBatch(db);

  snapshot.forEach((docSnap) => {
    batch.delete(doc(getTransactionsCollection(entity), docSnap.id));
  });

  await batch.commit();
}

/* ============================= */
/*        DELETE SINGLE          */
/* ============================= */

export async function deleteTransaction(
  entity: string,
  id: string
) {
  await deleteDoc(doc(db, "finance", entity, "transactions", id));
}