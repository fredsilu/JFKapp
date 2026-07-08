// src/services/archivedDocument.service.ts

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
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

  console.log("Total documents Firestore :", snapshot.size);

  const docs = snapshot.docs.map((d) => mapArchivedDocument(d.id, d.data()));

const byYear: Record<string, number> = {};

for (const doc of docs) {
  const date =
    doc.documentDate ||
    doc.invoiceDate ||
    doc.eventDate;

  const year = date ? date.substring(0, 4) : "Sans date";

  byYear[year] = (byYear[year] || 0) + 1;
}

console.log("Archives par année :", byYear);

return docs;

  return snapshot.docs.map((d) => mapArchivedDocument(d.id, d.data()));
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