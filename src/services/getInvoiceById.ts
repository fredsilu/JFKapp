import {
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import { CateringInvoice } from "@/types/catering";

const COLLECTION = "invoices";

/**
 * Récupère une facture par ID
 */
export async function getInvoiceById(
  invoiceId: string
): Promise<CateringInvoice | null> {

  const ref = doc(db, COLLECTION, invoiceId);

  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return null;
  }

  return {
    id: snap.id,
    ...(snap.data() as Omit<CateringInvoice, "id">),
  };
}