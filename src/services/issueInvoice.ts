//src/services/issueInvoice.ts
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import { CateringInvoice } from "@/types/catering";
import { generateInvoicePDFFile } from "@/src/services/invoicePdf.service";
import { uploadOfficialPdf } from "@/src/services/documentStorage.service";

const COLLECTION = "catering_invoices";

/**
 * Valide une facture
 * draft → issued
 *
 * Règle PDF :
 * - si pdfUrl existe déjà : ne pas re-uploader
 * - sinon : générer le PDF officiel une seule fois
 */
export async function issueInvoice(
  invoiceId: string
): Promise<CateringInvoice> {
  const ref = doc(db, COLLECTION, invoiceId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("Facture introuvable");
  }

  const invoice = {
    ...(snap.data() as Omit<CateringInvoice, "id">),
    id: snap.id,
  } as CateringInvoice & {
    pdfUrl?: string;
    pdfPath?: string;
    pdfGeneratedAt?: any;
  };

  if (invoice.status !== "draft") {
    throw new Error("La facture ne peut pas être émise");
  }

  let pdfPayload: {
    pdfUrl?: string;
    pdfPath?: string;
    pdfGeneratedAt?: any;
  } = {};

  if (!invoice.pdfUrl) {
    const pdfFile = await generateInvoicePDFFile({
      invoiceNumber: invoice.number,
      documentType: invoice.documentType,
      status: "issued",

      date: new Date().toISOString(),

      clientName: invoice.client?.name ?? "",
      clientRccm: invoice.client?.rccm ?? "",
      clientIdNat: invoice.client?.idNat ?? "",
      clientNif: invoice.client?.nif ?? "",
      clientAddress: invoice.client?.address ?? "",
      clientCity: invoice.client?.city ?? "Kinshasa / RDC",

      items: invoice.items ?? [],

      subtotal: invoice.totals?.subtotal ?? 0,
      discount: invoice.totals?.discount ?? 0,
      discountAmount: 0,
      totalAfterDiscount: invoice.totals?.total ?? 0,
      total: invoice.totals?.total ?? 0,

      eventName: invoice.eventName ?? invoice.designation ?? "",
      eventDate: invoice.dateLivraison ?? "",
      guestCount: invoice.guestCount ?? 0,
    } as any);

    pdfPayload = await uploadOfficialPdf({
      kind: "invoices",
      documentNumber: invoice.number,
      pdfBlob: pdfFile.blob,
    });
  }

  const now = serverTimestamp();

  await updateDoc(ref, {
    status: "issued",
    issuedAt: now,
    updatedAt: now,
    ...pdfPayload,
  });

  return {
    ...invoice,
    status: "issued",
    issuedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...pdfPayload,
  } as CateringInvoice;
}