// src/services/creditNote.service.ts
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";



import {
  CateringInvoice,
  CateringInvoiceHistoryType,
} from "@/types/catering";

const CREDIT_NOTES_COLLECTION = "credit_notes";
const INVOICES_COLLECTION = "catering_invoices";

export type CreditNoteStatus = "draft" | "issued" | "cancelled";

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
  issuedAt?: any;

  status: CreditNoteStatus;
  isLocked?: boolean;

  // PDF Storage
  pdfUrl?: string;
  pdfPath?: string;
  pdfGeneratedAt?: any;
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
  await addDoc(collection(db, INVOICES_COLLECTION, invoiceId, "history"), {
    type: payload.type,
    message: payload.message,
    createdBy: payload.createdBy ?? null,
    createdAt: serverTimestamp(),
    snapshot: payload.snapshot ?? null,
  });
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

export async function getCreditNoteById(
  creditNoteId: string
): Promise<CreditNote | null> {
  if (!creditNoteId) {
    throw new Error("Avoir invalide");
  }

  const ref = doc(db, CREDIT_NOTES_COLLECTION, creditNoteId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return {
    ...(snap.data() as Omit<CreditNote, "id">),
    id: snap.id,
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
    where("invoiceId", "==", invoiceId)
  );

  const snap = await getDocs(q);

  const notes = snap.docs.map((document) => ({
    ...(document.data() as Omit<CreditNote, "id">),
    id: document.id,
  }));

  return notes.sort((a, b) => {
    const da = a.createdAt?.toDate?.()?.getTime?.() ?? 0;
    const db = b.createdAt?.toDate?.()?.getTime?.() ?? 0;

    return db - da;
  });
}

async function validateInvoiceForCreditNote(invoiceId: string) {
  const invoiceRef = doc(db, INVOICES_COLLECTION, invoiceId);
  const invoiceSnap = await getDoc(invoiceRef);

  if (!invoiceSnap.exists()) {
    throw new Error("Facture introuvable");
  }

  const invoice: CateringInvoice = {
    ...(invoiceSnap.data() as Omit<CateringInvoice, "id">),
    id: invoiceSnap.id,
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

  return {
    invoiceRef,
    invoice,
    invoiceTotal,
  };
}

/* =========================================
   CREATE DRAFT CREDIT NOTE
========================================= */
export async function createDraftCreditNote(
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

  const { invoice, invoiceTotal } = await validateInvoiceForCreditNote(invoiceId);

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
  const existingDrafts = await getCreditNotesByInvoiceId(invoiceId);

  const existingDraft = existingDrafts.find(
    (n) => n.status === "draft"
  );

  if (existingDraft) {
    throw new Error(
      `Un brouillon d'avoir existe déjà (${existingDraft.number})`
    );
  }
  const number = await getNextCreditNoteNumber();

  const creditNote: Omit<CreditNote, "id"> = {
    invoiceId,
    invoiceNumber: invoice.number,

    number,

    reason: cleanReason,

    type: cleanAmount >= remainingCreditableAmount ? "full" : "partial",

    amount: cleanAmount,

    status: "draft",
    isLocked: false,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    issuedAt: null,
  };

  const ref = await addDoc(collection(db, CREDIT_NOTES_COLLECTION), creditNote);

  await addInvoiceHistory(invoiceId, {
    type: "CREDIT_NOTE_CREATED" as CateringInvoiceHistoryType,
    message: "Brouillon d’avoir créé",
    snapshot: {
      invoiceNumber: invoice.number,
      creditNoteId: ref.id,
      creditNoteNumber: number,
      amount: cleanAmount,
      invoiceTotal,
      existingCreditTotal,
      remainingCreditableAmount,
      reason: cleanReason,
      status: "draft",
    },
  });

  return {
    ...creditNote,
    id: ref.id,
  };
}

/* =========================================
   UPDATE DRAFT CREDIT NOTE
========================================= */
export async function updateDraftCreditNote(
  creditNoteId: string,
  payload: {
    amount: number;
    reason: string;
  }
): Promise<void> {
  if (!creditNoteId) {
    throw new Error("Avoir invalide");
  }

  const ref = doc(db, CREDIT_NOTES_COLLECTION, creditNoteId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("Avoir introuvable");
  }

  const creditNote: CreditNote = {
    ...(snap.data() as Omit<CreditNote, "id">),
    id: snap.id,
  };

  if (creditNote.status !== "draft") {
    throw new Error("Seul un avoir brouillon peut être modifié");
  }

  const cleanReason = payload.reason?.trim();
  const cleanAmount = Number(payload.amount);

  if (!cleanReason || cleanReason.length < 3) {
    throw new Error("Motif obligatoire");
  }

  if (!cleanAmount || cleanAmount <= 0) {
    throw new Error("Montant invalide");
  }

  const { invoiceTotal } = await validateInvoiceForCreditNote(
    creditNote.invoiceId
  );

  const existingCreditTotal = await getExistingCreditNotesTotal(
    creditNote.invoiceId
  );

  const remainingCreditableAmount = Math.max(
    invoiceTotal - existingCreditTotal,
    0
  );

  if (cleanAmount > remainingCreditableAmount) {
    throw new Error(
      `Le montant de l'avoir dépasse le solde disponible (${remainingCreditableAmount})`
    );
  }

  await updateDoc(ref, {
    amount: cleanAmount,
    reason: cleanReason,
    type: cleanAmount >= remainingCreditableAmount ? "full" : "partial",
    updatedAt: serverTimestamp(),
  });
}

/* =========================================
   ISSUE CREDIT NOTE
========================================= */
export async function issueCreditNote(
  creditNoteId: string
): Promise<CreditNote> {
  if (!creditNoteId) {
    throw new Error("Avoir invalide");
  }

  const ref = doc(db, CREDIT_NOTES_COLLECTION, creditNoteId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("Avoir introuvable");
  }

  const creditNote: CreditNote = {
    ...(snap.data() as Omit<CreditNote, "id">),
    id: snap.id,
  };

  if (creditNote.status !== "draft") {
    throw new Error("Seul un avoir brouillon peut être émis");
  }

  const { invoiceRef, invoice, invoiceTotal } =
    await validateInvoiceForCreditNote(creditNote.invoiceId);

  const existingCreditTotal = await getExistingCreditNotesTotal(
    creditNote.invoiceId
  );

  const cleanAmount = Number(creditNote.amount ?? 0);

  if (!cleanAmount || cleanAmount <= 0) {
    throw new Error("Montant de l’avoir invalide");
  }

  const remainingCreditableAmount = Math.max(
    invoiceTotal - existingCreditTotal,
    0
  );

  if (cleanAmount > remainingCreditableAmount) {
    throw new Error(
      `Le montant de l'avoir dépasse le solde disponible (${remainingCreditableAmount})`
    );
  }

  const newCreditTotal = existingCreditTotal + cleanAmount;
  const isFullCredit = newCreditTotal >= invoiceTotal;


  await updateDoc(ref, {
    status: "issued",
    isLocked: true,
    type: isFullCredit ? "full" : "partial",
    issuedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(invoiceRef, {
    creditNoteSummary: {
      totalCredited: newCreditTotal,
      remainingCreditableAmount: Math.max(invoiceTotal - newCreditTotal, 0),
      lastCreditNoteId: creditNote.id,
      lastCreditNoteNumber: creditNote.number,
      lastCreditNoteAmount: cleanAmount,
      lastCreditNoteAt: serverTimestamp(),
      isFullyCredited: isFullCredit,
    },

    updatedAt: serverTimestamp(),
  });

  await addInvoiceHistory(creditNote.invoiceId, {
    type: "CREDIT_NOTE_CREATED" as CateringInvoiceHistoryType,
    message: isFullCredit
      ? "Avoir total émis sur la facture"
      : "Avoir partiel émis sur la facture",
    snapshot: {
      invoiceNumber: invoice.number,
      creditNoteId: creditNote.id,
      creditNoteNumber: creditNote.number,
      amount: cleanAmount,
      previousCreditedAmount: existingCreditTotal,
      totalCredited: newCreditTotal,
      invoiceTotal,
      isFullCredit,
      reason: creditNote.reason,
      status: "issued",
    },
  });

  return {
    ...creditNote,
    status: "issued",
    isLocked: true,
    type: isFullCredit ? "full" : "partial",
  };
}

/* =========================================
   BACKWARD COMPATIBILITY
   Ancienne fonction : crée + émet directement
========================================= */
export async function createCreditNote(
  invoiceId: string,
  amount: number,
  reason: string
): Promise<CreditNote> {
  const draft = await createDraftCreditNote(invoiceId, amount, reason);

  if (!draft.id) {
    throw new Error("Avoir brouillon invalide");
  }

  return issueCreditNote(draft.id);
}