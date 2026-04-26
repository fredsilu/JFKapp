import {
  CateringInvoice
} from '@/src/services/cateringInvoice.service';

import { InvoicePdfData } from '@/types/invoicePdf.types';

function money(value: number) {
  return `${Number(value || 0).toLocaleString('fr-FR')} $`;
}

export function buildInvoiceHTML(invoice: InvoicePdfData) {
  const items = invoice.items || [];

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <style>
      body {
        font-family: Arial, sans-serif;
        padding: 36px;
        color: #111;
        font-size: 11px;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 1px solid #222;
        padding-bottom: 12px;
        margin-bottom: 28px;
      }

      .logo {
        font-size: 22px;
        font-weight: 900;
        color: #0B3A66;
      }

      .company {
        text-align: right;
        font-size: 10px;
        line-height: 1.4;
      }

      .title {
        font-size: 16px;
        font-weight: 900;
        margin-bottom: 4px;
      }

      .invoice-number {
        font-size: 12px;
        margin-bottom: 22px;
      }

      .meta {
        display: flex;
        justify-content: space-between;
        margin-bottom: 24px;
      }

      .client-name {
        font-size: 12px;
        font-weight: 900;
        margin-bottom: 6px;
      }

      .small {
        font-size: 10px;
        line-height: 1.5;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 18px;
      }

      th {
        background: #E9EEF5;
        font-size: 12px;
        font-weight: 700;
        padding: 8px;
        border: 1px solid #999;
        text-align: left;
      }

      td {
        font-size: 11px;
        padding: 8px;
        border: 1px solid #999;
      }

      .right {
        text-align: right;
      }

      .totals {
        margin-top: 18px;
        width: 45%;
        margin-left: auto;
      }

      .totals-row {
        display: flex;
        justify-content: space-between;
        padding: 7px 0;
        font-size: 12px;
      }

      .grand-total {
        font-weight: 900;
        border-top: 1px solid #111;
        font-size: 13px;
      }

      .note {
        margin-top: 28px;
        font-size: 10px;
        line-height: 1.5;
      }

      .stamp {
        margin-top: 45px;
        text-align: right;
        font-size: 11px;
        font-weight: 700;
      }
    </style>
  </head>

  <body>
    <div class="header">
      <div class="logo">CREPOLIA</div>

      <div class="company">
        CREPOLIA<br/>
        Kinshasa, RDC<br/>
        Service traiteur & restauration<br/>
        Tél : +243 ...
      </div>
    </div>

    <div class="title">FACTURE</div>
    <div class="invoice-number">N° ${invoice.invoiceNumber || ''}</div>

    <div class="meta">
      <div>
        <div class="client-name">${invoice.clientName || 'CLIENT NON RENSEIGNÉ'}</div>
        <div class="small">
          RCCM : ${invoice.clientRccm || '-'}<br/>
          IDNAT : ${invoice.clientIdnat || '-'}<br/>
          Adresse : ${invoice.clientAddress || '-'}<br/>
          Ville : ${invoice.clientCity || 'Kinshasa'}
        </div>
      </div>

      <div class="small">
        Date : ${invoice.date || ''}<br/>
        Devise : USD
      </div>
    </div>

    <p class="small">
      Vous trouverez ci-dessous la facture relative aux prestations convenues.
    </p>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="right">Jours</th>
          <th class="right">Qté</th>
          <th class="right">Prix unitaire</th>
          <th class="right">Total</th>
        </tr>
      </thead>

      <tbody>
        ${items.map((item: any) => `
          <tr>
            <td>${item.label || ''}</td>
            <td class="right">${item.days || 1}</td>
            <td class="right">${item.quantity || 1}</td>
            <td class="right">${money(item.unitPrice || 0)}</td>
            <td class="right">${money(item.totalPrice || 0)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row">
        <span>Sous-total</span>
        <span>${money(invoice.subtotal || invoice.total || 0)}</span>
      </div>

      <div class="totals-row grand-total">
        <span>Total à payer</span>
        <span>${money(invoice.total || 0)}</span>
      </div>
    </div>

    <div class="note">
      Commentaires ou indications : aucun.<br/>
      La totalité de la facture est payable conformément aux conditions convenues.
    </div>

    <div class="stamp">
      Pour CREPOLIA<br/><br/><br/>
      Signature & cachet
    </div>
  </body>
  </html>
  `;
}