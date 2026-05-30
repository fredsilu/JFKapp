// src/services/invoicePdf.service.ts
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { buildInvoiceHTML } from "@/src/utils/invoiceHtml";
import { InvoicePdfData } from "@/types/invoicePdf.types";

function getPdfDialogTitle(invoice: InvoicePdfData) {
  const documentType = invoice.documentType;
  const status = invoice.status;
  const number = invoice.invoiceNumber || "document";

  if (documentType === "CREDIT_NOTE") {
    return `Avoir ${number}`;
  }

  if (status === "cancelled") {
    return `Facture annulée ${number}`;
  }

  if (status === "replaced") {
    return `Facture remplacée ${number}`;
  }

  return `Facture ${number}`;
}

export async function generateInvoicePDF(
  invoice: InvoicePdfData
): Promise<string> {
  try {
    if (!invoice?.invoiceNumber) {
      throw new Error("Données facture invalides : numéro manquant");
    }

    const html = buildInvoiceHTML(invoice);

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    const canShare = await Sharing.isAvailableAsync();

    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: getPdfDialogTitle(invoice),
        UTI: "com.adobe.pdf",
      });
    }

    return uri;
  } catch (error) {
    console.error("❌ Erreur génération PDF facture:", error);
    throw error;
  }
}