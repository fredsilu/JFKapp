import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

import { Account, EntityType } from "@/types/finance.types";

const COLLECTION_NAME = "finance_accounts";

/* ============================= */
/*         CREATE ACCOUNT        */
/* ============================= */

export async function createAccount(
  account: Omit<Account, "id" | "createdAt">
) {
  await addDoc(collection(db, COLLECTION_NAME), {
    ...account,
    createdAt: Timestamp.fromDate(new Date()),
  });
}

/* ============================= */
/*     GET ACCOUNTS BY ENTITY    */
/* ============================= */

export async function getAccountsByEntity(entity: EntityType) {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("entity", "==", entity)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Account[];
}

/* ============================= */
/*        UPDATE ACCOUNT         */
/* ============================= */

export async function updateAccount(
  id: string,
  data: Partial<Account>
) {
  await updateDoc(doc(db, COLLECTION_NAME, id), {
    ...data,
    updatedAt: Timestamp.fromDate(new Date()),
  });
}

/* ============================= */
/*        DELETE ACCOUNT         */
/* ============================= */

export async function deleteAccount(id: string) {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
}