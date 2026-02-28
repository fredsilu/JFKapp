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
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { v4 as uuidv4 } from "uuid";

import { Transaction, InternalTransferInput } from "@/types/finance.types";

/* ============================= */
/*       ENTITY TYPE             */
/* ============================= */

export type Entity = "maison" | "crepolia";

/* ============================= */
/*       COLLECTION REF          */
/* ============================= */

const getTransactionsCollection = (entity: Entity) =>
  collection(db, "finance", entity, "transactions");

/* ============================= */
/*   FIRESTORE DATA SHAPE        */
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
   console.log("CREATE TRANSACTION FOR ENTITY:", entity);

  const docRef = await addDoc(getTransactionsCollection(entity), {
    ...transaction,
    date: Timestamp.fromDate(transaction.date),
    createdAt: Timestamp.now(),
    entity,
  });
 
  return docRef.id;
}

/* ============================= */
/*       GET BY ENTITY           */
/* ============================= */

export async function getTransactionsByEntity(
  entity: Entity
): Promise<Transaction[]> {
  const q = query(
    getTransactionsCollection(entity),
    orderBy("date", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap: QueryDocumentSnapshot<DocumentData>) => {
    const data = docSnap.data() as FirestoreTransaction;

    return {
      id: docSnap.id,
      ...data,
      date: data.date?.toDate(),
      createdAt: data.createdAt?.toDate(),
    };
  });
}

/* ============================= */
/*       INTERNAL TRANSFER       */
/* ============================= */

export async function createInternalTransfer(
  input: InternalTransferInput
) {
  const batch = writeBatch(db);
  const transferId = uuidv4();

  const sourceEntity = input.sourceEntity as Entity;
  const targetEntity = input.targetEntity as Entity;

  const sourceRef = doc(getTransactionsCollection(sourceEntity));
  const targetRef = doc(getTransactionsCollection(targetEntity));

  const baseData = {
    amount: input.amount,
    currency: input.currency,
    date: Timestamp.fromDate(input.date),
    category: "internal_transfer",
    description: input.description || "Transfert interne",
    isInternalTransfer: true,
    transferId,
    createdAt: Timestamp.now(),
  };

  batch.set(sourceRef, {
    ...baseData,
    type: "expense",
    accountId: input.sourceAccountId,
    entity: sourceEntity,
  });

  batch.set(targetRef, {
    ...baseData,
    type: "income",
    accountId: input.targetAccountId,
    entity: targetEntity,
  });

  await batch.commit();
}

/* ============================= */
/*    DELETE INTERNAL TRANSFER   */
/* ============================= */

export async function deleteInternalTransfer(
  entity: Entity,
  transferId: string
) {
  const q = query(
    getTransactionsCollection(entity),
    where("transferId", "==", transferId)
  );

  const snapshot = await getDocs(q);
  const batch = writeBatch(db);

  snapshot.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });

  await batch.commit();
}

/* ============================= */
/*        DELETE SINGLE          */
/* ============================= */

export async function deleteTransaction(
  entity: Entity,
  id: string
) {
  await deleteDoc(
    doc(db, "finance", entity, "transactions", id)
  );
}