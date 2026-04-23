import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type ProformaStatus =
  | 'draft'
  | 'sent'
  | 'approved'
  | 'rejected'
  | 'expired';

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
  data: Omit<CateringProforma, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>
) {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    isDeleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

export async function getCateringProformas(): Promise<CateringProforma[]> {
  const q = query(
    collection(db, COLLECTION),
    where('isDeleted', '==', false),
    orderBy('createdAt', 'desc')
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<CateringProforma, 'id'>),
  }));
}

export async function updateCateringProforma(
  id: string,
  data: Partial<CateringProforma>
) {
  const ref = doc(db, COLLECTION, id);

  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCateringProforma(id: string) {
  const ref = doc(db, COLLECTION, id);

  await updateDoc(ref, {
    isDeleted: true,
    updatedAt: serverTimestamp(),
  });
}