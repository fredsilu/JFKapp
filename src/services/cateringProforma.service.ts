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
  | 'expired'
  | 'converted';

export type CateringProformaItem = {
  label: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type CateringProformaMenuItem = {
  category?: string;
  name: string;
  notes?: string;
};

export type CateringProforma = {
  id?: string;
  simulationId?: string;

  clientId?: string;
  clientName?: string;
  clientRccm?: string;
  clientIdnat?: string;
  clientAddress?: string;
  clientCity?: string;

  number?: string;
  issueDate: string;
  validityDate?: string;
  eventDate?: string;
  status: ProformaStatus;
  items: CateringProformaItem[];
  menu: CateringProformaMenuItem[];
  totals: {
    subtotal: number;
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

function normalizeProformaData(
  data: Omit<
    CateringProforma,
    'id' | 'number' | 'createdAt' | 'updatedAt' | 'isDeleted'
  >
) {
  const clientName = normalizeClientName(data.clientName);

  return {
    ...data,
    clientName,
    clientId: cleanText(data.clientId),
    clientRccm: cleanText(data.clientRccm),
    clientIdnat: cleanText(data.clientIdnat),
    clientAddress: cleanText(data.clientAddress),
    clientCity: cleanText(data.clientCity),
    simulationId: cleanText(data.simulationId),
    issueDate: cleanText(data.issueDate),
    validityDate: cleanText(data.validityDate),
    eventDate: cleanText(data.eventDate),
    status: data.status || 'draft',
    items: Array.isArray(data.items) ? data.items : [],
    menu: Array.isArray(data.menu) ? data.menu : [],
    totals: {
      subtotal: Number(data.totals?.subtotal || 0),
      tax: Number(data.totals?.tax || 0),
      total: Number(data.totals?.total || 0),
      currency: data.totals?.currency || 'USD',
    },
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
    isDeleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

export async function getCateringProformas(): Promise<CateringProforma[]> {
  const q = query(collection(db, COLLECTION), where('isDeleted', '==', false));

  const snap = await getDocs(q);

  const data = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<CateringProforma, 'id'>),
  }));

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

  return {
    id: snap.id,
    ...(snap.data() as Omit<CateringProforma, 'id'>),
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
  
  if (typeof data.clientRccm !== 'undefined') {
    payload.clientRccm = cleanText(data.clientRccm);
  }

  if (typeof data.clientIdnat !== 'undefined') {
    payload.clientIdnat = cleanText(data.clientIdnat);
  }

  if (typeof data.clientAddress !== 'undefined') {
    payload.clientAddress = cleanText(data.clientAddress);
  }

  if (typeof data.clientCity !== 'undefined') {
    payload.clientCity = cleanText(data.clientCity);
  }

  await updateDoc(ref, {
    ...payload,
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