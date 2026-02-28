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

import { Transaction, InternalTransferInput } from "@/types/finance.types";

/* ============================= */
/*       COLLECTION REF          */
/* ============================= */

type Entity = "maison" | "crepolia";

const getTransactionsCollection = (entity: Entity) =>
  collection(db, "finance", entity, "transactions");

/* ============================= */
/*     FIRESTORE DATA SHAPE      */
/* ============================= */

type FirestoreTransaction = Omit<Transaction, "id" | "date" | "createdAt"> & {
  date: Timestamp;
  createdAt: Timestamp;
};

/* ============================= */
/*       CREATE TRANSACTION      */
/* ============================= */

export async function createTransaction(
  entity: Entity,
  transaction: Omit<Transaction, "id" | "createdAt" | "entity">
) {
  const docRef = await addDoc(getTransactionsCollection(entity), {
    ...transaction,
    // 🔒 on force Timestamp côté Firestore
    date: Timestamp.fromDate(transaction.date),
    createdAt: Timestamp.now(),
    // (optionnel) entity si tu veux le garder dans le doc:
    entity,
  });

  return docRef.id;
}

/* ============================= */
/*       GET BY ENTITY           */
/* ============================= */

export async function getTransactionsByEntity(entity: Entity) {
  const q = query(getTransactionsCollection(entity), orderBy("date", "desc"));
  const snapshot = await getDocs(q);

  console.log("✅ getTransactionsByEntity");
  console.log("ENTITY =", entity);
  console.log("PATH =", `finance/${entity}/transactions`);
  console.log("DOCS =", snapshot.size);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as FirestoreTransaction;

    return {
      id: docSnap.id,
      ...data,
      // ✅ conversion sûre Timestamp -> Date
      date: data.date.toDate(),
      createdAt: data.createdAt.toDate(),
    };
  });
}

/* ============================= */
/*       INTERNAL TRANSFER       */
/* ============================= */

export async function createInternalTransfer(input: InternalTransferInput) {
  const batch = writeBatch(db);
  const transferId = uuidv4();

  const sourceRef = doc(getTransactionsCollection(input.sourceEntity as Entity));
  const targetRef = doc(getTransactionsCollection(input.targetEntity as Entity));

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
    entity: input.sourceEntity,
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
    entity: input.targetEntity,
  });

  await batch.commit();
}

/* ============================= */
/*    DELETE INTERNAL TRANSFER   */
/* ============================= */

export async function deleteInternalTransfer(entity: Entity, transferId: string) {
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

export async function deleteTransaction(entity: Entity, id: string) {
  await deleteDoc(doc(db, "finance", entity, "transactions", id));
}