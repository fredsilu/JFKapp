//src/services/creditNotePdf.service.ts
import { CreditNote } from "@/src/services/creditNote.service";
import { CateringInvoice } from "@/types/catering";
import { InvoicePdfData } from "@/types/invoicePdf.types";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system/legacy";
import { buildInvoiceHTML } from "@/src/utils/invoiceHtml";


function toIsoDate(value: any): string {
    if (!value) return new Date().toISOString();

    if (typeof value === "string") {
        const trimmed = value.trim();

        const frenchMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (frenchMatch) {
            const [, day, month, year] = frenchMatch;
            return new Date(Number(year), Number(month) - 1, Number(day)).toISOString();
        }

        return trimmed;
    }

    if (value?.toDate) {
        return value.toDate().toISOString();
    }

    if (value instanceof Date) {
        return value.toISOString();
    }

    return new Date().toISOString();
}

export function buildCreditNotePdfData(
    creditNote: CreditNote,
    invoice: CateringInvoice
): InvoicePdfData {
    const client: any = invoice.client ?? {};
    const amount = Math.abs(Number(creditNote.amount ?? 0));
    const creditAmount = -amount;

    return {
        invoiceNumber: creditNote.number,
        date: toIsoDate(creditNote.issuedAt || creditNote.updatedAt || creditNote.createdAt),

        documentType: "CREDIT_NOTE",
        status: creditNote.status,

        clientName: client.name ?? "",
        clientRccm: client.rccm ?? client.RCCM ?? "",
        clientIdNat: client.idNat ?? client.idnat ?? client.idNAT ?? "",
        clientNif: client.nif ?? client.NIF ?? "",
        clientAddress: client.address ?? "",
        clientCity: client.city ?? "Kinshasa / RDC",

        subtotal: creditAmount,
        total: creditAmount,
        totalAfterDiscount: creditAmount,
        discount: 0,
        discountAmount: 0,

        items: [
            {
                label: `Avoir relatif à la facture ${creditNote.invoiceNumber}`,
                quantity: 1,
                unitPrice: creditAmount,
                totalPrice: creditAmount,
                total: creditAmount,
                days: 1,
                numberOfDays: 1,
            },
        ],

        creditNoteForInvoiceNumber: creditNote.invoiceNumber,
        creditNoteReason: creditNote.reason,
        originalInvoiceId: creditNote.invoiceId,
    } as InvoicePdfData & {
        creditNoteForInvoiceNumber?: string;
        creditNoteReason?: string;
        originalInvoiceId?: string;
    };
}

export async function generateCreditNotePDFFile(
    creditNote: CreditNote,
    invoice: CateringInvoice
): Promise<{
    uri: string;
    fileName: string;
    blob: Blob;
}> {
    const pdfData: any = buildCreditNotePdfData(creditNote, invoice);

    const html = buildInvoiceHTML(pdfData, {});

    const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
    });

    const fileName = `AVOIR_${creditNote.number}.pdf`;
    const finalUri = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.copyAsync({
        from: uri,
        to: finalUri,
    });

    const response = await fetch(finalUri);
    const blob = await response.blob();

    return {
        uri: finalUri,
        fileName,
        blob,
    };
}