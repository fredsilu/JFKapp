import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/* ============================= */
/* TYPES */
/* ============================= */

export type EntityType = "maison" | "crepolia";

export type AccountType = "cash" | "bank" | "mobile";
export type CurrencyType = "USD" | "CDF";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: CurrencyType;
  initialBalance: number;
  isActive: boolean;
  createdAt: Timestamp;
}

/* ============================= */
/* COLLECTION REF */
/* ============================= */

const getAccountsCollection = (entity: EntityType) => {
  return collection(db, "finance", entity, "accounts");
};

/* ============================= */
/* CREATE */
/* ============================= */

export const createAccount = async (
  entity: EntityType,
  data: Omit<Account, "id" | "createdAt">
) => {
  try {
    const docRef = await addDoc(getAccountsCollection(entity), {
      ...data,
      initialBalance: Number(data.initialBalance) || 0,
      createdAt: Timestamp.now(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Erreur création compte :", error);
    throw error;
  }
};

/* ============================= */
/* READ */
/* ============================= */

export const getAccountsByEntity = async (
  entity: EntityType
): Promise<Account[]> => {
  try {
    const q = query(
      getAccountsCollection(entity),
      where("isActive", "==", true),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<Account, "id">),
    }));
  } catch (error) {
    console.error("Erreur récupération comptes :", error);
    throw error;
  }
};

/* ============================= */
/* UPDATE */
/* ============================= */

export const updateAccount = async (
  entity: EntityType,
  accountId: string,
  updates: Partial<Omit<Account, "id" | "createdAt">>
) => {
  try {
    const accountRef = doc(db, "finance", entity, "accounts", accountId);
    await updateDoc(accountRef, updates);
  } catch (error) {
    console.error("Erreur mise à jour compte :", error);
    throw error;
  }
};

/* ============================= */
/* SOFT DELETE */
/* ============================= */

export const deactivateAccount = async (
  entity: EntityType,
  accountId: string
) => {
  try {
    const accountRef = doc(db, "finance", entity, "accounts", accountId);
    await updateDoc(accountRef, {
      isActive: false,
    });
  } catch (error) {
    console.error("Erreur suppression compte :", error);
    throw error;
  }
};

/* ============================= */
/* HARD DELETE (rare) */
/* ============================= */

export const deleteAccount = async (
  entity: EntityType,
  accountId: string
) => {
  try {
    const accountRef = doc(db, "finance", entity, "accounts", accountId);
    await deleteDoc(accountRef);
  } catch (error) {
    console.error("Erreur suppression définitive :", error);
    throw error;
  }
};