//src/services/issueInvoice.ts
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { CateringInvoice } from "@/types/catering";

const COLLECTION = "catering_invoices";

export async function issueInvoice(
  invoiceId: string
): Promise<CateringInvoice> {
  const ref = doc(db, COLLECTION, invoiceId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("Facture introuvable");
  }

  const invoice = {
    ...(snap.data() as Omit<CateringInvoice, "id">),
    id: snap.id,
  } as CateringInvoice;

  if (invoice.status !== "draft") {
    throw new Error("La facture ne peut pas être émise");
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
  } as CateringInvoice;
}