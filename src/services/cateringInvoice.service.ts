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
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { getNextInvoiceNumber } from '@/src/services/invoiceNumber.service';

const COLLECTION = 'catering_invoices';

export type InvoiceStatus =
  | 'draft'
  | 'issued'
  | 'cancelled'
  | 'credited'
  | 'partially_credited';

export type DiscountType = 'none' | 'percentage' | 'fixed';

export type InvoiceDiscount = {
  type: DiscountType;
  value: number;
  reason?: string;
};

export type CateringInvoice = {
  id?: string;

  proformaId?: string;
  orderId?: string;
  orderNumber?: string;

  number: string;

  clientId?: string;
  clientName?: string;
  clientRccm?: string;
  clientIdnat?: string;
  clientAddress?: string;
  clientCity?: string;

  issueDate: string;

  items: any[];

  discount?: InvoiceDiscount;

  totals: {
    subtotal: number;
    tax?: number;
    discountAmount?: number;
    totalAfterDiscount?: number;
    total: number;
    currency: 'USD' | 'CDF';
  };

  status: InvoiceStatus;

  cancellationReason?: string;
  cancelledAt?: any;

  createdAt?: any;
  updatedAt?: any;
};

function calculateDiscountAmount(
  subtotal: number,
  discount?: InvoiceDiscount
): number {
  if (!discount || discount.type === 'none') return 0;

  if (discount.value <= 0) return 0;

  if (discount.type === 'percentage') {
    return Math.min(subtotal * (discount.value / 100), subtotal);
  }

  if (discount.type === 'fixed') {
    return Math.min(discount.value, subtotal);
  }

  return 0;
}

function normalizeTotals(
  totals: any,
  discount?: InvoiceDiscount
): CateringInvoice['totals'] {
  const subtotal = Number(totals?.subtotal ?? 0);
  const tax = Number(totals?.tax ?? 0);
  const currency = totals?.currency ?? 'USD';

  const discountAmount = calculateDiscountAmount(subtotal, discount);
  const totalAfterDiscount = Math.max(subtotal - discountAmount, 0);
  const total = totalAfterDiscount + tax;

  return {
    subtotal,
    tax,
    discountAmount,
    totalAfterDiscount,
    total,
    currency,
  };
}

export async function getCateringInvoiceById(
  id: string
): Promise<CateringInvoice | null> {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...(snap.data() as Omit<CateringInvoice, 'id'>),
  };
}

export async function getCateringInvoices(): Promise<CateringInvoice[]> {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);

  return snap.docs
    .map((document) => ({
      id: document.id,
      ...(document.data() as Omit<CateringInvoice, 'id'>),
    }))
    .sort((a, b) => {
      const aTime =
        a.createdAt?.toMillis?.() ||
        new Date(a.issueDate || '').getTime() ||
        0;

      const bTime =
        b.createdAt?.toMillis?.() ||
        new Date(b.issueDate || '').getTime() ||
        0;

      return bTime - aTime;
    });
}

/* =========================================
   CREATE INVOICE FROM ORDER
========================================= */
export async function createInvoiceFromOrder(
  order: any,
  discount?: InvoiceDiscount
) {
  if (!order?.id) {
    throw new Error('Commande invalide');
  }

  const invoiceNumber = await getNextInvoiceNumber();
  const totals = normalizeTotals(order.totals, discount);

  const invoice: Omit<CateringInvoice, 'id'> = {
    orderId: order.id,
    orderNumber: order.number ?? '',

    proformaId: order.proformaId ?? '',

    number: invoiceNumber,

    clientId: order.clientId ?? '',
    clientName: order.client?.name ?? order.clientName ?? '',
    clientRccm: order.client?.rccm ?? order.clientRccm ?? '',
    clientIdnat: order.client?.idnat ?? order.clientIdnat ?? '',
    clientAddress: order.client?.address ?? order.clientAddress ?? '',
    clientCity: order.client?.city ?? order.clientCity ?? 'Kinshasa / RDC',

    issueDate: new Date().toISOString(),

    items: order.items ?? [],

    discount: discount ?? {
      type: 'none',
      value: 0,
    },

    totals,

    status: 'issued',

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, COLLECTION), invoice);

  return {
    id: ref.id,
    ...invoice,
  };
}

/* =========================================
   CREATE INVOICE FROM PROFORMA
========================================= */
export async function createInvoiceFromProforma(
  proforma: any,
  discount?: InvoiceDiscount
) {
  if (!proforma?.id) {
    throw new Error('Proforma invalide');
  }

  const invoiceNumber = await getNextInvoiceNumber();
  const totals = normalizeTotals(proforma.totals, discount);

  const invoice: Omit<CateringInvoice, 'id'> = {
    proformaId: proforma.id,

    number: invoiceNumber,

    clientId: proforma.clientId ?? '',
    clientName: proforma.clientName ?? '',
    clientRccm: proforma.clientRccm ?? '',
    clientIdnat: proforma.clientIdnat ?? '',
    clientAddress: proforma.clientAddress ?? '',
    clientCity: proforma.clientCity ?? 'Kinshasa / RDC',

    issueDate: new Date().toISOString(),

    items: proforma.items ?? [],

    discount: discount ?? {
      type: 'none',
      value: 0,
    },

    totals,

    status: 'issued',

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, COLLECTION), invoice);

  return {
    id: ref.id,
    ...invoice,
  };
}

/* =========================================
   CANCEL INVOICE
   Une facture émise ne doit pas être supprimée.
   Elle est annulée avec une raison.
========================================= */
export async function cancelCateringInvoice(
  invoiceId: string,
  reason: string
) {
  if (!invoiceId) {
    throw new Error('Facture invalide');
  }

  if (!reason || reason.trim().length < 3) {
    throw new Error("La raison d'annulation est obligatoire");
  }

  const ref = doc(db, COLLECTION, invoiceId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error('Facture introuvable');
  }

  const invoice = snap.data() as CateringInvoice;

  if (invoice.status === 'cancelled') {
    throw new Error('Cette facture est déjà annulée');
  }

  if (invoice.status === 'credited' || invoice.status === 'partially_credited') {
    throw new Error('Cette facture a déjà un avoir associé');
  }

  await updateDoc(ref, {
    status: 'cancelled',
    cancellationReason: reason.trim(),
    cancelledAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return true;
}