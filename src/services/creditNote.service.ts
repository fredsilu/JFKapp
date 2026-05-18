import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,orderBy,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import {
  CateringInvoice,
  CateringInvoiceHistoryType,
} from "@/types/catering";

const CREDIT_NOTES_COLLECTION = "credit_notes";
const INVOICES_COLLECTION = "catering_invoices";

export type CreditNoteStatus = "issued" | "cancelled";

export type CreditNoteType = "partial" | "full";

export type CreditNote = {
  id?: string;

  invoiceId: string;
  invoiceNumber: string;

  number: string;

  reason: string;

  type: CreditNoteType;

  amount: number;

  createdAt?: any;
  updatedAt?: any;

  status: CreditNoteStatus;
};

async function getNextCreditNoteNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const timestamp = Date.now();

  return `AV${year}-${timestamp}`;
}

async function addInvoiceHistory(
  invoiceId: string,
  payload: {
    type: CateringInvoiceHistoryType;
    message: string;
    createdBy?: string | null;
    snapshot?: any;
  }
) {
  await addDoc(
    collection(db, INVOICES_COLLECTION, invoiceId, "history"),
    {
      type: payload.type,
      message: payload.message,
      createdBy: payload.createdBy ?? null,
      createdAt: serverTimestamp(),
      snapshot: payload.snapshot ?? null,
    }
  );
}

async function getExistingCreditNotesTotal(invoiceId: string) {
  const q = query(
    collection(db, CREDIT_NOTES_COLLECTION),
    where("invoiceId", "==", invoiceId),
    where("status", "==", "issued")
  );

  const snap = await getDocs(q);

  return snap.docs.reduce((sum, document) => {
    const data = document.data() as CreditNote;
    return sum + Number(data.amount ?? 0);
  }, 0);
}

/* =========================================
   CREATE CREDIT NOTE
========================================= */
export async function createCreditNote(
  invoiceId: string,
  amount: number,
  reason: string
): Promise<CreditNote> {
  if (!invoiceId) {
    throw new Error("Facture invalide");
  }

  const cleanReason = reason?.trim();

  if (!cleanReason || cleanReason.length < 3) {
    throw new Error("Motif obligatoire");
  }

  const cleanAmount = Number(amount);

  if (!cleanAmount || cleanAmount <= 0) {
    throw new Error("Montant invalide");
  }

  const invoiceRef = doc(db, INVOICES_COLLECTION, invoiceId);
  const invoiceSnap = await getDoc(invoiceRef);

  if (!invoiceSnap.exists()) {
    throw new Error("Facture introuvable");
  }

  const invoice: CateringInvoice = {
    id: invoiceSnap.id,
    ...(invoiceSnap.data() as Omit<CateringInvoice, "id">),
  };

  if (invoice.documentType === "CREDIT_NOTE") {
    throw new Error("Impossible de créer un avoir sur une facture d’avoir");
  }

  if (invoice.status === "cancelled") {
    throw new Error("Impossible de créer un avoir sur une facture annulée");
  }

  if (invoice.status === "replaced") {
    throw new Error("Impossible de créer un avoir sur une facture remplacée");
  }

  const invoiceTotal = Number(invoice.totals?.total ?? 0);

  if (!invoiceTotal || invoiceTotal <= 0) {
    throw new Error("Le total de la facture est invalide");
  }

  const existingCreditTotal = await getExistingCreditNotesTotal(invoiceId);
  const remainingCreditableAmount = Math.max(
    invoiceTotal - existingCreditTotal,
    0
  );

  if (remainingCreditableAmount <= 0) {
    throw new Error("Cette facture est déjà totalement couverte par un avoir");
  }

  if (cleanAmount > remainingCreditableAmount) {
    throw new Error(
      `Le montant de l'avoir dépasse le solde disponible (${remainingCreditableAmount})`
    );
  }

  const number = await getNextCreditNoteNumber();

  const newCreditTotal = existingCreditTotal + cleanAmount;
  const isFullCredit = newCreditTotal >= invoiceTotal;

  const creditNote: Omit<CreditNote, "id"> = {
    invoiceId,
    invoiceNumber: invoice.number,

    number,

    reason: cleanReason,

    type: isFullCredit ? "full" : "partial",

    amount: cleanAmount,

    status: "issued",

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(
    collection(db, CREDIT_NOTES_COLLECTION),
    creditNote
  );

  await updateDoc(invoiceRef, {
    creditNoteSummary: {
      totalCredited: newCreditTotal,
      remainingCreditableAmount: Math.max(invoiceTotal - newCreditTotal, 0),
      lastCreditNoteId: ref.id,
      lastCreditNoteNumber: number,
      lastCreditNoteAmount: cleanAmount,
      lastCreditNoteAt: serverTimestamp(),
      isFullyCredited: isFullCredit,
    },

    updatedAt: serverTimestamp(),
  });

  await addInvoiceHistory(invoiceId, {
    type: "CREDIT_NOTE_CREATED",
    message: isFullCredit
      ? "Avoir total créé sur la facture"
      : "Avoir partiel créé sur la facture",
    snapshot: {
      invoiceNumber: invoice.number,
      creditNoteId: ref.id,
      creditNoteNumber: number,
      amount: cleanAmount,
      previousCreditedAmount: existingCreditTotal,
      totalCredited: newCreditTotal,
      invoiceTotal,
      isFullCredit,
      reason: cleanReason,
    },
  });

  return {
    id: ref.id,
    ...creditNote,
  };
}

export async function getCreditNotesByInvoiceId(
  invoiceId: string
): Promise<CreditNote[]> {
  if (!invoiceId) {
    throw new Error("Facture invalide");
  }

  const q = query(
    collection(db, CREDIT_NOTES_COLLECTION),
    where("invoiceId", "==", invoiceId),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  return snap.docs.map((document) => ({
    id: document.id,
    ...(document.data() as Omit<CreditNote, "id">),
  }));
}