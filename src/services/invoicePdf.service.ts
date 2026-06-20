// src/services/invoicePdf.service.ts
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";

import { buildInvoiceHTML } from "@/src/utils/invoiceHtml";
import { InvoicePdfData } from "@/types/invoicePdf.types";

import {
  getCompanySettings,
  getDefaultBankAccount,
} from "@/src/services/companySettings.service";

function sanitizeFileName(value?: string | null): string {
  return String(value || "document")
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 100);
}

function getInvoicePdfFileName(invoice: InvoicePdfData): string {
  const documentType = invoice.documentType;
  const status = invoice.status;
  const number = invoice.invoiceNumber || "document";

  if (documentType === "CREDIT_NOTE") {
    return `AVOIR_${number}.pdf`;
  }

  if (status === "cancelled") {
    return `FACTURE_ANNULEE_${number}.pdf`;
  }

  if (status === "replaced") {
    return `FACTURE_REMPLACEE_${number}.pdf`;
  }

  return `FACTURE_${number}.pdf`;
}

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

async function enrichInvoiceWithCompanySettings(
  invoice: InvoicePdfData
): Promise<InvoicePdfData> {
  const companySettings = await getCompanySettings();
  const bankAccount = getDefaultBankAccount(companySettings);

  return {
    ...invoice,

    companySettings,

    companyName: companySettings.companyName,
    companyPhone: companySettings.phone,
    companyEmail: companySettings.email,
    companyAddress: companySettings.address,
    companyRccm: companySettings.rccm,
    companyIdNat: companySettings.idNat,
    companyNif: companySettings.nif,

    bankName: bankAccount.bankName,
    bankAccountNumber: bankAccount.accountNumber,
    bankCurrency: bankAccount.currency,
  } as InvoicePdfData;
}

function getInvoiceAssets(invoice: InvoicePdfData) {
  return {
    logoBase64:
      (invoice as any).logoBase64 ||
      (invoice as any).assets?.logoBase64 ||
      (invoice as any).assets?.logoUri,

    stampBase64:
      (invoice as any).stampBase64 ||
      (invoice as any).assets?.stampBase64 ||
      (invoice as any).assets?.stampUri,

    signatureBase64:
      (invoice as any).signatureBase64 ||
      (invoice as any).assets?.signatureBase64 ||
      (invoice as any).assets?.signatureUri,
  };
}

export async function generateInvoicePDF(
  invoice: InvoicePdfData,
  filename?: string
): Promise<string> {
  try {
    if (!invoice?.invoiceNumber) {
      throw new Error("Données facture invalides : numéro manquant");
    }

    const enrichedInvoice = await enrichInvoiceWithCompanySettings(invoice);

    const html = buildInvoiceHTML(
      enrichedInvoice,
      getInvoiceAssets(enrichedInvoice)
    );

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    const finalFilename =
      sanitizeFileName(
        (filename || getInvoicePdfFileName(enrichedInvoice)).replace(
          /\.pdf$/i,
          ""
        )
      ) + ".pdf";

    const finalUri = `${FileSystem.cacheDirectory}${finalFilename}`;

    await FileSystem.copyAsync({
      from: uri,
      to: finalUri,
    });

    const canShare = await Sharing.isAvailableAsync();

    if (canShare) {
      await Sharing.shareAsync(finalUri, {
        mimeType: "application/pdf",
        dialogTitle: getPdfDialogTitle(enrichedInvoice),
        UTI: "com.adobe.pdf",
      });
    }

    return finalUri;
  } catch (error) {
    console.error("❌ Erreur génération PDF facture:", error);
    throw error;
  }
}

export async function generateInvoicePDFFile(
  invoice: InvoicePdfData,
  filename?: string
): Promise<{
  uri: string;
  fileName: string;
  blob: Blob;
}> {
  if (!invoice?.invoiceNumber) {
    throw new Error("Données facture invalides : numéro manquant");
  }

  const enrichedInvoice = await enrichInvoiceWithCompanySettings(invoice);

  const html = buildInvoiceHTML(
    enrichedInvoice,
    getInvoiceAssets(enrichedInvoice)
  );

  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  const finalFilename =
    sanitizeFileName(
      (filename || getInvoicePdfFileName(enrichedInvoice)).replace(
        /\.pdf$/i,
        ""
      )
    ) + ".pdf";

  const finalUri = `${FileSystem.cacheDirectory}${finalFilename}`;

  await FileSystem.copyAsync({
    from: uri,
    to: finalUri,
  });

  const response = await fetch(finalUri);
  const blob = await response.blob();

  return {
    uri: finalUri,
    fileName: finalFilename,
    blob,
  };
}