// src/catering/types/documents.ts

export type CateringDocumentType = "proforma" | "invoice";

export interface CateringPartyInfo {
  name: string;
  rccm?: string;
  idnat?: string;
  addressLine1?: string;
  addressLine2?: string;
  cityCountry?: string;
}

export interface CateringDocumentItem {
  label: string;
  days: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CateringDocumentTotals {
  subtotal: number;
  total: number;
  currency: "USD";
}

export interface CateringDocumentMeta {
  number: string;              // ex: CR2026-027 ou CR2026-FC-020
  sequence: number;            // ex: 27 ou 20
  year: number;                // ex: 2026
  createdAt: number;
  issueDate: string;           // ex: 2026-03-09
  eventDate: string;           // ex: 2026-03-09
  validUntil?: string;         // surtout pour proforma
}

export interface CateringDocumentCustomFields {
  comments?: string;           // pour facture : "Aucun"
  introText?: string;          // ex: "Vous trouverez ci-dessous pro-forma :"
  paymentNote?: string;
  footerContactNote?: string;
  thankYouNote?: string;
  depositPercentage?: number;  // ex: 70 pour proforma
}

export interface CateringDocumentAssets {
  logoUri?: string;
  stampUri?: string;
  signatureUri?: string;
}

export interface CateringDocument {
  id: string;
  orderId: string;
  type: CateringDocumentType;

  meta: CateringDocumentMeta;
  seller: CateringPartyInfo;
  client: CateringPartyInfo;

  eventName?: string;
  guestCount: number;

  items: CateringDocumentItem[];
  totals: CateringDocumentTotals;

  custom: CateringDocumentCustomFields;
  assets?: CateringDocumentAssets;

  pdfUri?: string;
  pdfDownloadUrl?: string;

  status?: "draft" | "generated" | "sent" | "paid";
}