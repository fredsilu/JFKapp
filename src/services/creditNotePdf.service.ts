//src/services/creditNotePdf.service.ts
import { CreditNote } from "@/src/services/creditNote.service";
import { CateringInvoice } from "@/types/catering";
import { InvoicePdfData } from "@/types/invoicePdf.types";

function toIsoDate(value: any): string {
    if (!value) return new Date().toISOString();

    if (typeof value === "string") return value;

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