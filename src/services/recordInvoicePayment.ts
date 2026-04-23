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
 * Enregistre le paiement d'une facture
 * issued → paid
 */
export async function recordInvoicePayment(
  invoiceId: string,
  amountPaid: number,
  paymentMethod: "cash" | "bank" | "mobile"
): Promise<CateringInvoice> {

  const ref = doc(db, COLLECTION, invoiceId);

  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("Invoice not found");
  }

  const invoice = snap.data() as CateringInvoice;

  if (invoice.status !== "issued") {
    throw new Error("Invoice must be issued before payment");
  }

  const now = serverTimestamp();

  await updateDoc(ref, {
    status: "paid",
    paidAt: now,
    paymentMethod,
    amountPaid,
    updatedAt: now,
  });

  return {
    ...invoice,
    status: "paid",
    paidAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
}