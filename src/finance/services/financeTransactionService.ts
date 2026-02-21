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
/*       COLLECTION NAME         */
/* ============================= */

const COLLECTION_NAME = "finance_transactions";

/* ============================= */
/*       CREATE TRANSACTION      */
/* ============================= */

export async function createTransaction(
  transaction: Omit<Transaction, "id" | "createdAt">
) {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
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
    collection(db, COLLECTION_NAME),
    where("entity", "==", entity),
    orderBy("date", "desc") // nécessite index composite
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

  const sourceRef = doc(collection(db, COLLECTION_NAME));
  const targetRef = doc(collection(db, COLLECTION_NAME));

  // Dépense côté source
  batch.set(sourceRef, {
    entity: input.sourceEntity,
    type: "expense",
    amount: input.amount,
    currency: input.currency,
    date: Timestamp.fromDate(input.date),
    accountId: input.sourceAccountId,
    category: "internal_transfer",
    description: input.description || "Transfert interne",
    isInternalTransfer: true,
    transferId,
    internalTargetEntity: input.targetEntity,
    createdAt: Timestamp.now(),
  });

  // Entrée côté destination
  batch.set(targetRef, {
    entity: input.targetEntity,
    type: "income",
    amount: input.amount,
    currency: input.currency,
    date: Timestamp.fromDate(input.date),
    accountId: input.targetAccountId,
    category: "internal_transfer",
    description: input.description || "Transfert interne",
    isInternalTransfer: true,
    transferId,
    internalTargetEntity: input.sourceEntity,
    createdAt: Timestamp.now(),
  });

  await batch.commit();
}

/* ============================= */
/*    DELETE INTERNAL TRANSFER   */
/* ============================= */

export async function deleteInternalTransfer(transferId: string) {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("transferId", "==", transferId)
  );

  const snapshot = await getDocs(q);
  const batch = writeBatch(db);

  snapshot.forEach((docSnap) => {
    batch.delete(doc(db, COLLECTION_NAME, docSnap.id));
  });

  await batch.commit();
}

/* ============================= */
/*        DELETE SINGLE          */
/* ============================= */

export async function deleteTransaction(id: string) {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
}