import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { buildInvoiceHTML } from '@/src/utils/invoiceHtml';
import { InvoicePdfData } from '@/types/invoicePdf.types';

export async function generateInvoicePDF(invoice: InvoicePdfData) {
  try {
    if (!invoice || !invoice.invoiceNumber) {
      throw new Error('Données facture invalides');
    }

    const html = buildInvoiceHTML(invoice);

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    const canShare = await Sharing.isAvailableAsync();

    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Facture ${invoice.invoiceNumber}`,
        UTI: 'com.adobe.pdf',
      });
    }

    return uri;
  } catch (error) {
    console.error('❌ Erreur génération PDF facture:', error);
    throw error;
  }
}