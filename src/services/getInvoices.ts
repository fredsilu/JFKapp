import {
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import { CateringInvoice } from "@/types/catering";

const COLLECTION = "invoices";

/**
 * Récupère toutes les factures
 */
export async function getInvoices(): Promise<CateringInvoice[]> {

  const q = query(
    collection(db, COLLECTION),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<CateringInvoice, "id">),
  }));
}