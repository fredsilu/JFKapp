import {
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

/**
 * Valide une facture
 */
export async function issueInvoice(invoiceId: string) {

  const ref = doc(db, "invoices", invoiceId);

  await updateDoc(ref, {
    status: "issued",
    issuedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

}