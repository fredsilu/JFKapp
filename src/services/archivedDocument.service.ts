// src/services/archivedDocument.service.ts

import {
  addDoc,
  updateDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { ArchivedDocument } from "@/types/archives";

const COLLECTION_NAME = "archived_documents";

function toDateString(value: any): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;

  if (value?.toDate) {
    return value.toDate().toISOString().slice(0, 10);
  }

  if (value?.seconds) {
    return new Date(value.seconds * 1000).toISOString().slice(0, 10);
  }

  return undefined;
}

function mapArchivedDocument(id: string, data: any): ArchivedDocument {
  return {
    id,
    type: data.type,
    number: data.number || "",

    clientId: data.clientId || undefined,
    clientName: data.clientName || "",
    historicalClientName: data.historicalClientName || undefined,
    clientMatchStatus: data.clientMatchStatus || undefined,

    designation: data.designation || undefined,

    documentDate: toDateString(data.documentDate),
    eventDate: toDateString(data.eventDate),
    eventTime: typeof data.eventTime === "string" ? data.eventTime : undefined,

    invoiceDate: toDateString(data.invoiceDate),
    paymentDate: toDateString(data.paymentDate),

    amount:
      typeof data.amount === "number"
        ? data.amount
        : data.amount
          ? Number(data.amount)
          : undefined,

    currency: data.currency || "USD",

    linkedInvoiceNumber: data.linkedInvoiceNumber || undefined,
    linkedProformaNumber: data.linkedProformaNumber || undefined,

    fileName: data.fileName || "",
    pdfUrl: data.pdfUrl || "",
    storagePath: data.storagePath || "",

    source: data.source || "historical_import",

    importBatch: data.importBatch || undefined,
    importStatus: data.importStatus || undefined,

    importedAt: data.importedAt as Timestamp | undefined,
    createdAt: data.createdAt as Timestamp | undefined,
    updatedAt: data.updatedAt as Timestamp | undefined,
  };
}

export async function fetchArchivedDocuments(): Promise<ArchivedDocument[]> {
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));

  return snapshot.docs.map((d) => mapArchivedDocument(d.id, d.data()));
}

export async function fetchArchivedDocumentsByType(
  type: "invoice" | "proforma" | "credit_note"
): Promise<ArchivedDocument[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("type", "==", type)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => mapArchivedDocument(d.id, d.data()));
}

export async function fetchArchivedInvoices(): Promise<ArchivedDocument[]> {
  return fetchArchivedDocumentsByType("invoice");
}

export async function fetchArchivedProformas(): Promise<ArchivedDocument[]> {
  return fetchArchivedDocumentsByType("proforma");
}

export async function fetchArchivedCreditNotes(): Promise<ArchivedDocument[]> {
  return fetchArchivedDocumentsByType("credit_note");
}

export async function fetchArchivedDocumentById(
  id: string
): Promise<ArchivedDocument | null> {
  const ref = doc(db, COLLECTION_NAME, id);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) return null;

  return mapArchivedDocument(snapshot.id, snapshot.data());
}

export async function createArchivedDocument(
  payload: Omit<
    ArchivedDocument,
    "id" | "createdAt" | "updatedAt" | "importedAt"
  >
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    importedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateArchivedDocument(
  id: string,
  payload: Partial<
    Pick<
      ArchivedDocument,
      | "number"
      | "clientId"
      | "clientName"
      | "historicalClientName"
      | "clientMatchStatus"
      | "designation"
      | "documentDate"
      | "eventDate"
      | "eventTime"
      | "invoiceDate"
      | "paymentDate"
      | "amount"
      | "currency"
      | "linkedInvoiceNumber"
      | "linkedProformaNumber"
    >
  >
): Promise<void> {
  await updateDoc(doc(db, COLLECTION_NAME, id), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function updateArchivedDocumentPdf(
  id: string,
  payload: {
    pdfUrl: string;
    storagePath: string;
    fileName?: string;
  }
): Promise<void> {
  await updateDoc(doc(db, COLLECTION_NAME, id), {
    pdfUrl: payload.pdfUrl,
    storagePath: payload.storagePath,
    ...(payload.fileName ? { fileName: payload.fileName } : {}),
    importStatus: "complete",
    updatedAt: serverTimestamp(),
  });
}

/**
 * Convertit une archive en objet compatible avec une facture.
 */
export function normalizeArchivedInvoice(archive: ArchivedDocument) {
  return {
    id: archive.id,

    number: archive.number,

    clientName:
      archive.clientName ||
      archive.historicalClientName ||
      "-",

    designation: archive.designation,
    eventName: archive.designation,

    eventDate: archive.eventDate || archive.documentDate,
    issuedAt: archive.invoiceDate || archive.documentDate,

    createdAt: archive.createdAt || archive.importedAt,

    totals: {
      total: archive.amount || 0,
    },

    currency: archive.currency || "USD",

    status: "historical",

    pdfUrl: archive.pdfUrl,
    storagePath: archive.storagePath,

    source: archive.source,
    isHistorical: true,
  };
}

/**
 * Convertit une archive en objet compatible avec une proforma.
 */
export function normalizeArchivedProforma(archive: ArchivedDocument) {
  return {
    id: archive.id,

    number: archive.number,

    clientName:
      archive.clientName ||
      archive.historicalClientName ||
      "-",

    eventName: archive.designation,

    eventDate: archive.eventDate || archive.documentDate,

    createdAt: archive.createdAt || archive.importedAt,

    validityDate: undefined,

    totals: {
      total: archive.amount || 0,
    },

    currency: archive.currency || "USD",

    status: "historical",

    pdfUrl: archive.pdfUrl,
    storagePath: archive.storagePath,

    source: archive.source,
    isHistorical: true,
  };
}

/**
 * Convertit une archive en objet compatible avec un avoir.
 */
export function normalizeArchivedCreditNote(archive: ArchivedDocument) {
  return {
    id: archive.id,

    number: archive.number,

    clientName:
      archive.clientName ||
      archive.historicalClientName ||
      "-",

    invoiceNumber: archive.linkedInvoiceNumber,

    createdAt: archive.createdAt || archive.importedAt,

    amount: archive.amount || 0,

    currency: archive.currency || "USD",

    status: "historical",

    pdfUrl: archive.pdfUrl,
    storagePath: archive.storagePath,

    source: archive.source,
    isHistorical: true,
  };
}