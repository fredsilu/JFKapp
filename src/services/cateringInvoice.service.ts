// src/services/cateringInvoice.service.ts
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { getNextInvoiceNumber } from "@/src/services/invoiceNumber.service";

import {
  CateringInvoice,
  isCateringInvoiceLocked,
  CateringInvoiceHistoryType,
} from "@/types/catering";

const COLLECTION = "catering_invoices";

export type DiscountType = "none" | "percentage" | "fixed";

export type InvoiceDiscount = {
  type: DiscountType;
  value: number;
  reason?: string;
};

function calculateDiscountAmount(
  subtotal: number,
  discount?: InvoiceDiscount
): number {
  if (!discount || discount.type === "none") return 0;
  if (discount.value <= 0) return 0;

  if (discount.type === "percentage") {
    return Math.min(subtotal * (discount.value / 100), subtotal);
  }

  if (discount.type === "fixed") {
    return Math.min(discount.value, subtotal);
  }

  return 0;
}

function normalizeTotals(
  totals: any,
  discount?: InvoiceDiscount
): CateringInvoice["totals"] {
  const subtotal = Number(totals?.subtotal ?? totals?.totalHT ?? 0);
  const tax = Number(totals?.tax ?? 0);
  const currency = totals?.currency ?? "USD";

  const existingDiscount = Number(totals?.discount ?? 0);
  const calculatedDiscount = calculateDiscountAmount(subtotal, discount);

  const discountAmount =
    existingDiscount > 0 ? existingDiscount : calculatedDiscount;

  const totalAfterDiscount = Math.max(subtotal - discountAmount, 0);
  const total = totalAfterDiscount + tax;

  return {
    ...totals,
    subtotal,
    discount: discountAmount,
    tax,
    discountAmount,
    totalAfterDiscount,
    total,
    currency,
  };
}

async function addInvoiceHistory(
  invoiceId: string,
  payload: {
    type: CateringInvoiceHistoryType
    message: string;
    createdBy?: string | null;
    snapshot?: any;
  }
) {
  await addDoc(collection(db, COLLECTION, invoiceId, "history"), {
    type: payload.type,
    message: payload.message,
    createdBy: payload.createdBy ?? null,
    createdAt: serverTimestamp(),
    snapshot: payload.snapshot ?? null,
  });
}

export async function getCateringInvoiceById(
  id: string
): Promise<CateringInvoice | null> {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...(snap.data() as Omit<CateringInvoice, "id">),
  };
}

export async function getCateringInvoices(): Promise<CateringInvoice[]> {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  return snap.docs.map((document) => ({
    id: document.id,
    ...(document.data() as Omit<CateringInvoice, "id">),
  }));
}

/* =========================================
   CREATE INVOICE FROM ORDER
========================================= */
export async function createInvoiceFromOrder(
  order: any,
  discount?: InvoiceDiscount
): Promise<CateringInvoice> {
  if (!order?.id) {
    throw new Error("Commande invalide");
  }

  if (order.invoiceId) {
    throw new Error("Cette commande possède déjà une facture");
  }

  const invoiceNumber = await getNextInvoiceNumber();
  const totals = normalizeTotals(order.totals, discount);

  const invoice: Omit<CateringInvoice, "id"> = {
    documentType: "INVOICE",

    orderId: order.id,
    sourceProformaId: order.proformaId ?? order.sourceProformaId ?? null,

    number: invoiceNumber,
    status: "issued",

    clientId: order.clientId ?? "",
    client: {
      name: order.client?.name ?? order.clientName ?? "",
      address: order.client?.address ?? order.clientAddress ?? "",
      cityCountry:
        order.client?.cityCountry ??
        order.client?.city ??
        order.clientCity ??
        "Kinshasa / RDC",
      phone: order.client?.phone ?? "",
      notes: order.client?.notes ?? "",
      rccm: order.client?.rccm ?? order.clientRccm ?? "",
      idNat: order.client?.idNat ?? order.client?.idnat ?? order.clientIdnat ?? "",
    },

    designation: order.designation ?? order.name ?? "Prestation traiteur",

    dateLivraison: order.dateLivraison ?? "",
    deliveryTime: order.deliveryTime ?? order.heureLivraison ?? "",
    deliveryAddress: order.deliveryAddress ?? order.lieu ?? "",

    guestCount: order.guestCount ?? 0,

    comment: order.comment ?? "",

    items: order.items ?? [],
    totals,

    correction: {
      correctionType: null,
    },

    cancellation: null,

    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,

    issuedAt: serverTimestamp() as any,

    createdBy: null,
    issuedBy: null,

    version: 1,
    isLocked: true,
  };

  const ref = await addDoc(collection(db, COLLECTION), invoice);

  await updateDoc(doc(db, "orders", order.id), {
    invoiceId: ref.id,
    updatedAt: serverTimestamp(),
  });

  await addInvoiceHistory(ref.id, {
    type: "CREATED",
    message: "Facture créée depuis la commande",
    snapshot: {
      number: invoice.number,
      status: invoice.status,
      documentType: invoice.documentType,
      total: invoice.totals?.total,
    },
  });

  await addInvoiceHistory(ref.id, {
    type: "ISSUED",
    message: "Facture émise et verrouillée",
    snapshot: {
      number: invoice.number,
      status: invoice.status,
      isLocked: true,
    },
  });

  return {
    id: ref.id,
    ...invoice,
  };
}

/* =========================================
   CANCEL INVOICE
========================================= */
export async function cancelCateringInvoice(
  invoiceId: string,
  reason: string
): Promise<boolean> {
  if (!invoiceId) {
    throw new Error("Facture invalide");
  }

  const cleanReason = reason?.trim();

  if (!cleanReason || cleanReason.length < 3) {
    throw new Error("La raison d'annulation est obligatoire");
  }

  const ref = doc(db, COLLECTION, invoiceId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("Facture introuvable");
  }

  const invoice = {
    id: snap.id,
    ...(snap.data() as Omit<CateringInvoice, "id">),
  };

  if (invoice.status === "cancelled") {
    throw new Error("Cette facture est déjà annulée");
  }

  if (invoice.status === "paid" || invoice.status === "partial") {
    throw new Error(
      "Une facture payée ou partiellement payée doit être corrigée par une facture d'avoir"
    );
  }

  if (!isCateringInvoiceLocked(invoice)) {
    throw new Error(
      "Une facture en brouillon doit être modifiée ou supprimée avant émission"
    );
  }

  await updateDoc(ref, {
    status: "cancelled",
    isLocked: true,
    cancellation: {
      reason: cleanReason,
      cancelledAt: serverTimestamp(),
      cancelledBy: null,
    },
    updatedAt: serverTimestamp(),
  });

  await addInvoiceHistory(invoiceId, {
    type: "CANCELLED",
    message: "Facture annulée",
    snapshot: {
      number: invoice.number,
      previousStatus: invoice.status,
      newStatus: "cancelled",
      reason: cleanReason,
    },
  });

  return true;
}

/* =========================================
   ANNULER ET REMPLACER UNE FACTURE
========================================= */
export async function replaceInvoice(
  invoiceId: string,
  updatedData: {
    items?: any[];
    totals?: any;
    comment?: string;
    designation?: string;
  }
): Promise<CateringInvoice> {
  if (!invoiceId) {
    throw new Error("Facture invalide");
  }

  const ref = doc(db, COLLECTION, invoiceId);

  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("Facture introuvable");
  }

  const oldInvoice = {
    id: snap.id,
    ...(snap.data() as Omit<CateringInvoice, "id">),
  };

  if (oldInvoice.status === "paid") {
    throw new Error(
      "Une facture payée doit être corrigée par une facture d'avoir"
    );
  }

  if (oldInvoice.status === "cancelled") {
    throw new Error(
      "Impossible de remplacer une facture annulée"
    );
  }

  if (oldInvoice.status === "replaced") {
    throw new Error(
      "Cette facture a déjà été remplacée"
    );
  }

  /*
   * Nouveau numéro officiel
   */
  const newInvoiceNumber =
    await getNextInvoiceNumber();

  /*
   * Nouvelle facture corrigée
   */
  const newInvoice: Omit<CateringInvoice, "id"> = {
    ...oldInvoice,

    number: newInvoiceNumber,

    status: "issued",

    correction: {
      correctionType: "ANNULLE_ET_REMPLACE",

      replacesInvoiceId: oldInvoice.id,
      replacesInvoiceNumber: oldInvoice.number,
    },

    items:
      updatedData.items ??
      oldInvoice.items,

    totals:
      updatedData.totals ??
      oldInvoice.totals,

    designation:
      updatedData.designation ??
      oldInvoice.designation,

    comment:
      updatedData.comment ??
      oldInvoice.comment,

    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
    issuedAt: serverTimestamp() as any,

    version:
      Number(oldInvoice.version ?? 1) + 1,

    isLocked: true,
  };

  /*
   * Création nouvelle facture
   */
  const newRef = await addDoc(
    collection(db, COLLECTION),
    newInvoice
  );

  /*
   * Ancienne facture => replaced
   */
  await updateDoc(ref, {
    status: "replaced",

    correction: {
      ...(oldInvoice.correction ?? {}),

      correctionType: "ANNULLE_ET_REMPLACE",

      replacedByInvoiceId: newRef.id,
      replacedByInvoiceNumber:
        newInvoiceNumber,
    },

    updatedAt: serverTimestamp(),
  });

  /*
   * Historique ancienne facture
   */
  await addInvoiceHistory(invoiceId, {
    type: "REPLACED",
    message:
      "Facture annulée et remplacée",

    snapshot: {
      oldInvoiceNumber:
        oldInvoice.number,

      replacedBy:
        newInvoiceNumber,
    },
  });

  /*
   * Historique nouvelle facture
   */
  await addInvoiceHistory(newRef.id, {
    type: "CREATED",
    message:
      "Facture créée par annule et remplace",

    snapshot: {
      number: newInvoiceNumber,
      replaces:
        oldInvoice.number,
    },
  });

  await addInvoiceHistory(newRef.id, {
    type: "ISSUED",
    message:
      "Nouvelle facture émise",

    snapshot: {
      status: "issued",
    },
  });

  return {
    id: newRef.id,
    ...newInvoice,
  };
}

/* =========================================
   GET INVOICE HISTORY
========================================= */
export async function getInvoiceHistory(
  invoiceId: string
): Promise<any[]> {
  if (!invoiceId) {
    throw new Error("Facture invalide");
  }

  const q = query(
    collection(db, COLLECTION, invoiceId, "history"),
    orderBy("createdAt", "asc")
  );

  const snap = await getDocs(q);

  return snap.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
}