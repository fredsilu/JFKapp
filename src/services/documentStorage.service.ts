//src/services/documentStorage.service.ts
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { serverTimestamp } from "firebase/firestore";

import { storage } from "@/lib/firebase";

export type DocumentStorageKind =
  | "invoices"
  | "proformas"
  | "credit-notes";

function sanitizeFileName(value: string) {
  return value
    .trim()
    .replace(/[^\w.-]+/g, "_")
    .replace(/_+/g, "_");
}

export async function uploadOfficialPdf(params: {
  kind: DocumentStorageKind;
  documentNumber: string;
  pdfBlob: Blob;
}) {
  const safeNumber = sanitizeFileName(params.documentNumber);
  const fileName = `${safeNumber}.pdf`;
  const pdfPath = `documents/${params.kind}/${fileName}`;

  const fileRef = ref(storage, pdfPath);

  await uploadBytes(fileRef, params.pdfBlob, {
    contentType: "application/pdf",
  });

  const pdfUrl = await getDownloadURL(fileRef);

  return {
    pdfUrl,
    pdfPath,
    pdfGeneratedAt: serverTimestamp(),
  };
}