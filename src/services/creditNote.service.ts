import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';

import {
  CateringInvoice,
} from '@/src/services/cateringInvoice.service';

const COLLECTION = 'credit_notes';

export type CreditNoteStatus =
  | 'issued'
  | 'cancelled';

export type CreditNote = {
  id?: string;

  invoiceId: string;
  invoiceNumber: string;

  number: string;

  reason: string;

  type: 'partial' | 'full';

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

/* =========================================
   CREATE CREDIT NOTE
========================================= */
export async function createCreditNote(
  invoiceId: string,
  amount: number,
  reason: string
) {
  if (!invoiceId) {
    throw new Error('Facture invalide');
  }

  if (amount <= 0) {
    throw new Error('Montant invalide');
  }

  if (!reason || reason.trim().length < 3) {
    throw new Error('Motif obligatoire');
  }

  const invoiceRef = doc(db, 'catering_invoices', invoiceId);

  const invoiceSnap = await getDoc(invoiceRef);

  if (!invoiceSnap.exists()) {
    throw new Error('Facture introuvable');
  }

  const invoice = {
    id: invoiceSnap.id,
    ...(invoiceSnap.data() as CateringInvoice),
  };

  if (invoice.status === 'cancelled') {
    throw new Error(
      'Impossible de créer un avoir sur une facture annulée'
    );
  }

  const invoiceTotal = Number(invoice.totals?.total ?? 0);

  if (amount > invoiceTotal) {
    throw new Error(
      "Le montant de l'avoir dépasse le total de la facture"
    );
  }

  const number = await getNextCreditNoteNumber();

  const isFullCredit = amount >= invoiceTotal;

  const creditNote: Omit<CreditNote, 'id'> = {
    invoiceId: invoice.id!,
    invoiceNumber: invoice.number,

    number,

    reason: reason.trim(),

    type: isFullCredit ? 'full' : 'partial',

    amount,

    status: 'issued',

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(
    collection(db, COLLECTION),
    creditNote
  );

  await updateDoc(invoiceRef, {
    status: isFullCredit
      ? 'credited'
      : 'partially_credited',

    updatedAt: serverTimestamp(),
  });

  return {
    id: ref.id,
    ...creditNote,
  };
}