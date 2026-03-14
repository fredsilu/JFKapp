import {
  addDoc,
  collection,
  doc,
  updateDoc,
  serverTimestamp,
  runTransaction,
  Timestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import {
  CateringOrder,
  CateringInvoice,
} from "@/types/catering";

const INVOICE_COLLECTION = "invoices";
const ORDER_COLLECTION = "orders";

/**
 * Génère le prochain numéro de facture
 * Format : CR2026-FC-001
 */
async function getNextInvoiceNumber(): Promise<string> {

  const year = new Date().getFullYear();

  const counterRef = doc(db, "counters", `invoice_${year}`);

  const nextNumber = await runTransaction(db, async (transaction) => {

    const counterDoc = await transaction.get(counterRef);

    if (!counterDoc.exists()) {

      transaction.set(counterRef, { current: 1 });

      return 1;
    }

    const current = counterDoc.data()?.current ?? 0;

    const next = current + 1;

    transaction.update(counterRef, { current: next });

    return next;
  });

  const padded = nextNumber.toString().padStart(3, "0");

  return `CR${year}-FC-${padded}`;
}

/**
 * Génère une facture à partir d'un order
 */
export async function generateInvoiceFromOrder(
  order: CateringOrder
): Promise<CateringInvoice> {

  if (order.invoiceId) {
    throw new Error("This order already has an invoice.");
  }

  const invoiceNumber = await getNextInvoiceNumber();

  const now = serverTimestamp();

  const invoiceData: Omit<CateringInvoice, "id"> = {

    orderId: order.id,

    sourceProformaId:
      order.documentType === "proforma"
        ? order.id
        : null,

    number: invoiceNumber,

    status: "draft",

    clientId: order.clientId,
    client: order.client,

    designation: order.designation,

    dateLivraison: order.dateLivraison,
    deliveryTime: order.deliveryTime,
    deliveryAddress: order.deliveryAddress,

    guestCount: order.guestCount,

    comment: order.comment,

    items: order.items,
    totals: order.totals,

    createdAt: now as unknown as Timestamp,
    updatedAt: now as unknown as Timestamp,

    issuedAt: null,
  };

  const docRef = await addDoc(
    collection(db, INVOICE_COLLECTION),
    invoiceData
  );

  await updateDoc(
    doc(db, ORDER_COLLECTION, order.id),
    {
      invoiceId: docRef.id,
      updatedAt: serverTimestamp(),
    }
  );

  return {
    id: docRef.id,
    ...invoiceData,
  };
}