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

export async function createCateringProforma(
  data: Omit<
    CateringProforma,
    'id' | 'number' | 'createdAt' | 'updatedAt' | 'isDeleted'
  >
): Promise<string> {
  const number = await getNextProformaNumber();

  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    number,
    isDeleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

export async function getCateringProformas(): Promise<CateringProforma[]> {
  const q = query(
    collection(db, COLLECTION),
    where('isDeleted', '==', false)
  );

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

  await updateDoc(ref, {
    ...data,
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