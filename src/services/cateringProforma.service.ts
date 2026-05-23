//src/services/cateringProforma.service.ts
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
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { getNextProformaNumber } from '@/src/services/proformaNumber.service';

export type ProformaStatus =
  | 'draft'
  | 'sent'
  | 'approved'
  | 'rejected'
  | 'converted'
  | 'invoiced';

export type CateringProformaItem = {
  label: string;
  quantity: number;
  unitPrice: number;
  total: number;
  // AJOUT
  numberOfDays?: number;
};

export type CateringProformaMenuItem = {
  dishId: string;
  name: string;
  category?: string;
  notes?: string;
};

export type CateringProforma = {
  id?: string;
  simulationId?: string;

  clientId?: string;
  clientName?: string;
  clientRccm?: string;
  clientIdnat?: string;
  clientNif?: string;
  clientAddress?: string;
  clientCity?: string;

  number?: string;
  issueDate: string;
  validityDate?: string;
  eventDate?: string;

  status: ProformaStatus;

  orderId?: string;
  orderNumber?: string;
  convertedAt?: any;

  service?: string;
  serviceType?: string;

  isInvoiced?: boolean;
  invoiceId?: string;
  invoiceNumber?: string;
  invoicedAt?: any;

  items: CateringProformaItem[];
  menu: CateringProformaMenuItem[];

  totals: {
    subtotal: number;
    discount?: number;
    tax?: number;
    total: number;
    currency: 'USD' | 'CDF';
  };

  createdAt?: any;
  updatedAt?: any;
  isDeleted?: boolean;
};

const COLLECTION = 'catering_proformas';

function cleanText(value?: string | null): string {
  return value && value.trim() ? value.trim() : '';
}

function normalizeClientName(value?: string | null): string {
  const clientName = cleanText(value);

  if (!clientName || clientName.toLowerCase() === 'client') {
    throw new Error('Le nom du client est obligatoire pour créer une proforma.');
  }

  return clientName;
}

function normalizeItems(items?: CateringProformaItem[]): CateringProformaItem[] {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unitPrice || 0);
      const total = Number(item.total || quantity * unitPrice);

      return {
        label: cleanText(item.label),
        quantity,
        unitPrice,
        total,
        numberOfDays: Number(item.numberOfDays || 1),
      };
    })
    .filter((item) => item.label.length > 0);
}

function normalizeMenu(
  menu?: CateringProformaMenuItem[]
): CateringProformaMenuItem[] {
  if (!Array.isArray(menu)) return [];

  return menu
    .map((item) => ({
      dishId: cleanText(item.dishId),
      name: cleanText(item.name),
      category: cleanText(item.category),
      notes: cleanText(item.notes),
    }))
    .filter((item) => item.dishId.length > 0 && item.name.length > 0);
}

function normalizeTotals(totals?: CateringProforma['totals']) {
  const subtotal = Number(totals?.subtotal || 0);
  const discount = Number(totals?.discount || 0);
  const tax = Number(totals?.tax || 0);
  const total = Number(
    totals?.total || Math.max(subtotal - discount + tax, 0)
  );

  return {
    subtotal,
    discount,
    tax,
    total,
    currency: totals?.currency || 'USD',
  };
}

function normalizeProformaData(
  data: Omit<
    CateringProforma,
    'id' | 'number' | 'createdAt' | 'updatedAt' | 'isDeleted'
  >
) {
  const clientName = normalizeClientName(data.clientName);
  const items = normalizeItems(data.items);
  const menu = normalizeMenu(data.menu);

  return {
    ...data,

    clientName,
    clientId: cleanText(data.clientId),
    clientRccm: cleanText(data.clientRccm),
    clientIdnat: cleanText(data.clientIdnat),
    clientAddress: cleanText(data.clientAddress),
    clientNif: cleanText(data.clientNif),
    clientCity: cleanText(data.clientCity),

    service: cleanText(data.service),
    serviceType: cleanText(data.serviceType),

    simulationId: cleanText(data.simulationId),
    issueDate: cleanText(data.issueDate),
    validityDate: cleanText(data.validityDate),
    eventDate: cleanText(data.eventDate),

    status: data.status || 'draft',
    isInvoiced: Boolean(data.isInvoiced),

    orderId: cleanText(data.orderId),
    orderNumber: cleanText(data.orderNumber),

    invoiceId: cleanText(data.invoiceId),
    invoiceNumber: cleanText(data.invoiceNumber),

    items,
    menu,
    totals: normalizeTotals(data.totals),
  };
}

export async function createCateringProforma(
  data: Omit<
    CateringProforma,
    'id' | 'number' | 'createdAt' | 'updatedAt' | 'isDeleted'
  >
): Promise<string> {
  const number = await getNextProformaNumber();
  const normalizedData = normalizeProformaData(data);

  const ref = await addDoc(collection(db, COLLECTION), {
    ...normalizedData,
    number,
    status: normalizedData.status || 'draft',
    isInvoiced: false,
    isDeleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

export async function getCateringProformas(): Promise<CateringProforma[]> {
  const q = query(collection(db, COLLECTION), where('isDeleted', '==', false));

  const snap = await getDocs(q);

  const data: CateringProforma[] = snap.docs.map((d) => {
    const raw = d.data() as Omit<CateringProforma, 'id'>;

    return {
      id: d.id,
      ...raw,
      items: normalizeItems(raw.items),
      menu: normalizeMenu(raw.menu),
      totals: normalizeTotals(raw.totals),
    };
  });

  return data.sort((a, b) => {
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

export async function getCateringProformaById(
  id: string
): Promise<CateringProforma | null> {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const data = snap.data() as Omit<CateringProforma, 'id'>;

  return {
    id: snap.id,
    ...data,
    items: normalizeItems(data.items),
    menu: normalizeMenu(data.menu),
    totals: normalizeTotals(data.totals),
  };
}

export async function updateCateringProforma(
  id: string,
  data: Partial<CateringProforma>
): Promise<void> {
  const ref = doc(db, COLLECTION, id);

  const payload: Partial<CateringProforma> = {
    ...data,
  };

  if (typeof data.clientName !== 'undefined') {
    payload.clientName = normalizeClientName(data.clientName);
  }


  if (typeof data.clientId !== 'undefined') {
    payload.clientId = cleanText(data.clientId);
  }

  if (typeof data.clientRccm !== 'undefined') {
    payload.clientRccm = cleanText(data.clientRccm);
  }

  if (typeof data.clientIdnat !== 'undefined') {
    payload.clientIdnat = cleanText(data.clientIdnat);
  }
  if (typeof data.clientNif !== 'undefined') {
    payload.clientNif = cleanText(data.clientNif);
  }

  if (typeof data.clientAddress !== 'undefined') {
    payload.clientAddress = cleanText(data.clientAddress);
  }


  if (typeof data.service !== 'undefined') {
    payload.service = cleanText(data.service);
  }

  if (typeof data.serviceType !== 'undefined') {
    payload.serviceType = cleanText(data.serviceType);
  }

  if (typeof data.clientCity !== 'undefined') {
    payload.clientCity = cleanText(data.clientCity);
  }

  if (typeof data.simulationId !== 'undefined') {
    payload.simulationId = cleanText(data.simulationId);
  }

  if (typeof data.issueDate !== 'undefined') {
    payload.issueDate = cleanText(data.issueDate);
  }

  if (typeof data.validityDate !== 'undefined') {
    payload.validityDate = cleanText(data.validityDate);
  }

  if (typeof data.eventDate !== 'undefined') {
    payload.eventDate = cleanText(data.eventDate);
  }

  if (typeof data.orderId !== 'undefined') {
    payload.orderId = cleanText(data.orderId);
  }

  if (typeof data.orderNumber !== 'undefined') {
    payload.orderNumber = cleanText(data.orderNumber);
  }

  if (typeof data.invoiceId !== 'undefined') {
    payload.invoiceId = cleanText(data.invoiceId);
  }

  if (typeof data.invoiceNumber !== 'undefined') {
    payload.invoiceNumber = cleanText(data.invoiceNumber);
  }

  if (typeof data.items !== 'undefined') {
    payload.items = normalizeItems(data.items);
  }

  if (typeof data.menu !== 'undefined') {
    payload.menu = normalizeMenu(data.menu);
  }

  if (typeof data.totals !== 'undefined') {
    payload.totals = normalizeTotals(data.totals);
  }

  await updateDoc(ref, {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function updateCateringProformaMenu(
  id: string,
  menu: CateringProformaMenuItem[]
): Promise<void> {
  const ref = doc(db, COLLECTION, id);

  await updateDoc(ref, {
    menu: normalizeMenu(menu),
    updatedAt: serverTimestamp(),
  });
}

/* =========================================
   MARK PROFORMA AS CONVERTED TO ORDER
========================================= */
export async function markProformaAsConvertedToOrder(
  id: string,
  orderId: string,
  orderNumber: string
): Promise<void> {
  const ref = doc(db, COLLECTION, id);

  await updateDoc(ref, {
    status: 'converted',
    orderId,
    orderNumber,
    convertedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/* =========================================
   MARK PROFORMA AS INVOICED
   À utiliser plus tard après événement
========================================= */
export async function markProformaAsInvoiced(
  id: string,
  invoiceId: string,
  invoiceNumber: string
): Promise<void> {
  const ref = doc(db, COLLECTION, id);

  await updateDoc(ref, {
    status: 'invoiced',
    isInvoiced: true,
    invoiceId,
    invoiceNumber,
    invoicedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCateringProforma(id: string): Promise<void> {
  const ref = doc(db, COLLECTION, id);

  await updateDoc(ref, {
    isDeleted: true,
    updatedAt: serverTimestamp(),
  });
}