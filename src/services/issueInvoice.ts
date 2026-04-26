import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import { CateringInvoice } from "@/types/catering";

const COLLECTION = "invoices";

/**
 * Valide une facture
 * draft → issued
 */
export async function issueInvoice(
  invoiceId: string
): Promise<CateringInvoice> {

  const ref = doc(db, COLLECTION, invoiceId);

  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("Invoice not found");
  }

  const invoice = snap.data() as CateringInvoice;

  if (invoice.status !== "draft") {
    throw new Error("Invoice cannot be issued");
  }

  const now = serverTimestamp();

  await updateDoc(ref, {
    status: "issued",
    issuedAt: now,
    updatedAt: now,
  });

  return {
    ...invoice,
    status: "issued",
    issuedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
}