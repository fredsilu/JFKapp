// types/archives.ts
import { Timestamp } from "firebase/firestore";
import { CateringCurrency } from "@/types/catering";

export type ArchivedDocumentType = "invoice" | "proforma";

export type ArchivedClientMatchStatus =
  | "mapped"
  | "new_historical_client"
  | "unmapped"
  | "manual_alias"
  | "matched"
  | "recovered_missing_invoice";

export type ArchivedDocumentImportStatus =
  | "complete"
  | "metadata_incomplete"
  | "pdf_without_excel_match"
  | "excel_without_pdf"
  | "missing_pdf"
  | "duplicate_pdf";

export interface ArchivedDocument {
  id?: string;

  type: ArchivedDocumentType;
  number: string;

  clientName: string;
  clientId?: string;
  historicalClientName?: string;
  clientMatchStatus?: ArchivedClientMatchStatus;
  clientMatchReason?: string;

  designation?: string;

  documentDate?: string;
  eventDate?: string;
  eventTime?: string;

  invoiceDate?: string;
  paymentDate?: string;

  amount?: number;
  currency?: CateringCurrency;

  linkedInvoiceNumber?: string;
  linkedProformaNumber?: string;

  fileName: string;
  pdfUrl?: string;
  storagePath?: string;

  source: "historical_import";

  importBatch?: string;
  importStatus?: ArchivedDocumentImportStatus | string;

  importedAt?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}