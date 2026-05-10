import {
  addDoc,
  collection,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';

import {
  CateringOrder,
  CateringDocumentClient,
} from '@/types/catering';

import {
  CateringDocumentItem,
  CateringDocumentTotals,
} from '@/types/documents';

/**
 * Type de document
 */
export type DocumentType = 'proforma' | 'invoice';

/**
 * Statut document
 */
export type DocumentStatus = 'draft' | 'sent' | 'paid';

/**
 * Document unifié simplifié pour Firestore
 */
export interface CateringDocument {
  id?: string;

  type: DocumentType;
  orderId: string;

  number: string;
  version: number;

  client: CateringDocumentClient;

  items: CateringDocumentItem[];
  totals: CateringDocumentTotals;

  status: DocumentStatus;

  createdAt: Timestamp;
}

/**
 * Génération numéro simple temporaire
 */
function generateDocumentNumber(type: DocumentType): string {
  const year = new Date().getFullYear();
  const prefix = type === 'proforma' ? 'PF' : 'FC';

  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');

  return `${prefix}-${year}-${random}`;
}

/**
 * Création document depuis Order
 */
export async function createDocumentFromOrder(
  order: CateringOrder,
  type: DocumentType
): Promise<{ id: string }> {
  if (!order) {
    throw new Error('Order is required');
  }

  if (!order.items || order.items.length === 0) {
    throw new Error('Order has no items');
  }

  if (!order.totals) {
    throw new Error('Order totals missing');
  }

  const payload: Omit<CateringDocument, 'id'> = {
    type,
    orderId: order.id,

    number: generateDocumentNumber(type),
    version: 1,

    client: order.client,

    items: order.items,
    totals: order.totals,

    status: 'draft',

    createdAt: serverTimestamp() as Timestamp,
  };

  const docRef = await addDoc(collection(db, 'catering_documents'), payload);

  return {
    id: docRef.id,
  };
}