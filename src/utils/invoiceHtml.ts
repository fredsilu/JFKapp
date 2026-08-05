//src/utils/invoiceHtml.ts
import { InvoicePdfData } from "@/types/invoicePdf.types";

type InvoicePdfAssets = {
  logoBase64?: string;
  stampBase64?: string;
  signatureBase64?: string;
};

function money(value?: number) {
  return Number(value || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
function getDocumentCurrency(invoice: InvoicePdfData): "USD" | "CDF" {
  return (invoice.currency as "USD" | "CDF") || "USD";
}

function getExchangeRate(invoice: InvoicePdfData): number {
  const rate = Number(invoice.exchangeRate || 0);
  return Number.isFinite(rate) && rate > 0 ? rate : 1;
}

function convertFromUsd(
  value: number | undefined,
  currency: "USD" | "CDF",
  exchangeRate: number,
): number {
  const amount = Number(value || 0);
  return currency === "CDF" ? amount * exchangeRate : amount;
}

function currencySymbol(currency: "USD" | "CDF") {
  return currency === "CDF" ? "CDF" : "$";
}

function formatMoneyByCurrency(value: number, currency: "USD" | "CDF") {
  return Number(value || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: currency === "CDF" ? 0 : 2,
    maximumFractionDigits: currency === "CDF" ? 0 : 2,
  });
}

function safe(value?: string | null) {
  return value && value.trim() ? value.trim() : "";
}

function toDate(value: any): Date | null {
  if (!value) return null;

  if (value?.toDate) return value.toDate();

  if (value instanceof Date) return value;

  if (typeof value === "string") {
    const trimmed = value.trim();

    // Format français : JJ/MM/AAAA
    const frenchMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (frenchMatch) {
      const [, day, month, year] = frenchMatch;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }

    // Format ISO : AAAA-MM-JJ
    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }

    const parsed = new Date(trimmed);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function formatLongDate(value: any, lang: "fr" | "en" = "fr") {
  const date = toDate(value);
  if (!date) return "—";

  return date.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatShortDate(value: any, lang: "fr" | "en" = "fr") {
  const date = toDate(value);
  if (!date) return "—";

  return date.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function safeClientName(invoice: InvoicePdfData) {
  const name = safe(invoice.clientName);

  if (!name || name.toLowerCase() === "client") {
    return "NOM DU CLIENT À RENSEIGNER";
  }

  return name;
}

function formatClientCity(value?: string | null) {
  const city = safe(value);

  if (!city) return "Kinshasa / RDC";

  if (city.toLowerCase().includes("rdc")) {
    return city;
  }

  return `${city} / RDC`;
}

function getDocumentTitle(status?: string, documentType?: string) {
  if (documentType === "CREDIT_NOTE") {
    return "FACTURE D’AVOIR";
  }

  if (status === "cancelled") {
    return "FACTURE ANNULÉE";
  }

  if (status === "replaced") {
    return "FACTURE ANNULÉE ET REMPLACÉE";
  }

  return "FACTURE";
}

export function buildInvoiceHTML(
  invoice: InvoicePdfData,
  assets?: InvoicePdfAssets,
): string {
  const items = invoice.items || [];

  const isCreditNote = (invoice as any).documentType === "CREDIT_NOTE";
  const documentCurrency = getDocumentCurrency(invoice);
  const exchangeRate = getExchangeRate(invoice);
  const currency = currencySymbol(documentCurrency);

  const rows = items
    .map(
      (item: any) => `
<tr>
  <td class="designation">${safe(item.label)}</td>
  <td class="center">
  ${
    Number(item.days ?? item.numberOfDays ?? 0) > 0
      ? Number(item.days ?? item.numberOfDays)
      : "-"
  }
</td>
  <td class="center">${item.quantity || 0}</td>
  <td class="currency">${currency}</td>
<td class="price">
  ${formatMoneyByCurrency(
    convertFromUsd(item.unitPrice, documentCurrency, exchangeRate),
    documentCurrency,
  )}
</td>

<td class="currency">${currency}</td>
<td class="price">
  ${formatMoneyByCurrency(
    convertFromUsd(
      item.totalPrice ?? item.total,
      documentCurrency,
      exchangeRate,
    ),
    documentCurrency,
  )}
</td>
</tr>`,
    )
    .join("");

  const subtotal = invoice.subtotal ?? invoice.total ?? 0;
  const discountAmount = (invoice as any).discountAmount ?? 0;

  const totalAfterDiscount =
    (invoice as any).totalAfterDiscount ?? invoice.total ?? subtotal;

  const displayedSubtotal = convertFromUsd(
    subtotal,
    documentCurrency,
    exchangeRate,
  );

  const displayedDiscountAmount = convertFromUsd(
    discountAmount,
    documentCurrency,
    exchangeRate,
  );

  const displayedTotalAfterDiscount = convertFromUsd(
    totalAfterDiscount,
    documentCurrency,
    exchangeRate,
  );

  const status = (invoice as any).status ?? "issued";

  const clientName = safeClientName(invoice);
  const clientRccm = safe(invoice.clientRccm);
  const clientIdNat = safe(invoice.clientIdNat);
  const clientAddress = safe(invoice.clientAddress);
  const clientCity = formatClientCity(invoice.clientCity);
  const clientNif = safe((invoice as any).clientNif);

  const invoiceDateFormatted = formatLongDate(invoice.date, "fr");

  const eventDateFormatted = formatShortDate(
    (invoice as any).eventDate ||
      (invoice as any).dateEvenement ||
      (invoice as any).deliveryDate ||
      (invoice as any).dateLivraison,
    "fr",
  );
  const servicePeriod = safe((invoice as any).servicePeriod);

  const guestCount = Number(
    (invoice as any).guestCount ?? (invoice as any).numberOfPeople ?? 0,
  );

  const guestCountHtml =
    guestCount > 0 ? `<strong>Nbr de personnes :</strong> ${guestCount}` : "";

  const eventName =
    safe((invoice as any).eventName) ||
    safe((invoice as any).eventTitle) ||
    "Évènement sans nom";

  const companyPhone = safe((invoice as any).companyPhone) || "+243 898111165";

  const companyEmail =
    safe((invoice as any).companyEmail) || "contact@crepolia.com";

  const companyAddress = (
    safe((invoice as any).companyAddress) || "54, Avenue de la Justice\nC/Gombe"
  ).replace(/\n/g, "<br/>");

  const companyRccm =
    safe((invoice as any).companyRccm) || "CD/KNG/RCCM/20-A-00139";

  const companyIdNat = safe((invoice as any).companyIdNat) || "01-852-N58548R";

  const companyNif = safe((invoice as any).companyNif) || "A2171348B";

  const bankName = safe((invoice as any).bankName) || "EQUITYBCDC";

  const bankAccountNumber =
    safe((invoice as any).bankAccountNumber) || "0121265120026";

  const bankCurrency = safe((invoice as any).bankCurrency) || "USD";

  const bankText = `${bankName} : ${bankAccountNumber} ${bankCurrency}`;

  const headerHTML = `
<div class="header">
  <div class="logo">
    ${assets?.logoBase64 ? `<img src="${assets.logoBase64}" />` : ""}
  </div>

  <div class="address">
    Tél. : ${companyPhone}<br/>
    ${companyEmail}<br/>
    ${companyAddress}
  </div>
</div>

<div class="top-line"></div>
`;

  const footerHTML = `
<div class="page-footer">
  RCCM : ${companyRccm}&nbsp;&nbsp;
  ID Nat : ${companyIdNat}&nbsp;&nbsp;
  NIF : ${companyNif}
</div>
`;

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />

<style>
@page {
  size: A4;
  margin: 5px 40px 5px 40px;
}

* {
  box-sizing: border-box;
  font-family: 'Montserrat', Arial, sans-serif;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

body {
  margin: 0;
  padding: 0;
  color: #5f6368;
  font-size: 10px;
}
  .status-credited {
  background: #fef3c7;
  color: #92400e;
}

.pdf-page {
  position: relative;
  min-height: 1080px;
  padding: 10px 10px 30px 10px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.logo img {
  width: 155px;
  max-height: 90px;
  object-fit: contain;
  margin-left: -20px;
}

.address {
  margin-top: 5px;
  text-align: right;
  font-size: 12px;
  line-height: 1.25;
  font-weight: 300;
  color: #374151;
}

.top-line {
  border-bottom: 1px solid #2f3b4f;
}

.title {
  margin-top: 18px;
  font-size: 14px;
  font-weight: 900;
  color: #3f4650;
  letter-spacing: 0.5px;
}

.number {
  margin-top: 6px;
  font-size: 12px;
  color: #6b7280;
}

.client-block {
  text-align: right;
  margin-top: 10px;
  font-size: 10px;
  line-height: 1.42;
  color: #666;
}

.client-block div {
  margin-bottom: 2px;
}

.client-name {
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.7px;
  color: #3f4650;
}

.issue-date {
  margin-top: 22px;
  font-size: 11px;
}

.intro {
  margin-top: 25px;
  margin-bottom: 4px;
  font-size: 10px;
  color: #7a7a7a;
}

.main-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.main-table th {
  background: #6f9eb8;
  color: #f7f7f7;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 3px;
  border: 2px solid white;
  text-align: center;
}

.main-table td {
  background: #dce8ee;
  border: 2px solid white;
  padding: 3px 5px;
  font-size: 11px;
  color: #5f6368;
}

.main-table .event td {
  background: #c8dbe5;
  vertical-align: top;
  line-height: 1.35;
  padding-top: 4px;
  padding-bottom: 4px;
}

.main-table .event td:first-child {
  font-weight: 700;
}

.col-designation { width: 40%; }
.col-days { width: 10%; }
.col-qty { width: 12%; }
.col-pu-currency { width: 3%; }
.col-pu { width: 19%; }
.col-pt-currency { width: 3%; }
.col-pt { width: 18%; }

.designation {
  text-align: left;
}

.center {
  text-align: center;
}

.currency {
  text-align: right;
  border-right: none !important;
  padding-right: 2px !important;
  padding-left: 0 !important;
  font-weight: 700;
}

.price {
  text-align: right;
  border-left: none !important;
  padding-left: 2px !important;
  padding-right: 6px !important;
  font-variant-numeric: tabular-nums;
}

.main-table td.currency + td.price {
  border-left: 0 !important;
}

.totals {
  width: 49%;
  margin-left: auto;
  margin-top: 5px;
}

.subtotal {
  display: grid;
  grid-template-columns: 1fr 22px 128px;
  background: #dce8ee;
  border-top: 2px solid #111827;
  border-right: 1px solid #6f9eb8;
  border-bottom: 1px solid #6f9eb8;
  border-left: 1px solid #6f9eb8;
  padding: 6px 10px;
  font-size: 12px;
  color: #555;
}

.grand-total {
  display: grid;
  grid-template-columns: 1fr 22px 128px;
  background: #2f3b4f;
  color: white;
  padding: 8px 10px;
  margin-top: 26px;
  font-size: 12px;
  font-weight: 700;
}

.payment {
  margin-top: 39px;
  border-top: 2px solid #9ca3af;
  padding-top: 8px;
  font-size: 10px;
  font-style: italic;
  line-height: 1.5;
  color: #777;
}

.payment-block {
  margin-top: 38px;
  border-top: 1.5px solid #333;
  padding-top: 7px;
  text-align: center;
  color: #111;
}

.payment-title {
  font-size: 11px;
  font-weight: 900;
  line-height: 1.25;
  text-align: left;
  color: #111;
}

.payment-text {
  margin-top: 7px;
  font-size: 9.5px;
  font-style: italic;
  line-height: 1.35;
  text-align: left;
  color: #111;
}

.payment-contact {
  margin-top: 18px;
  font-size: 10.5px;
  font-weight: 500;
  text-align: center;
  color: #111;
}

.payment-thanks {
  margin-top: 12px;
  font-size: 15px;
  font-weight: 900;
  text-align: center;
  color: #111;
  letter-spacing: 0.2px;
}

.signature-area {
  position: relative;
  height: 155px;
}

.stamp {
  position: absolute;
  left: 18px;
  top: 4px;
}

.stamp img {
  width: 245px;
  object-fit: contain;
}

.signature {
  position: absolute;
  left: 355px;
  top: -12px;
}

.signature img {
  width: 250px;
  object-fit: contain;
}

.stamp-text {
  position: absolute;
  right: 20px;
  top: 45px;
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  color: #374151;
}

.page-footer {
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 5px;
  padding-top: 8px;
  border-top: 1px solid #2f3b4f;
  text-align: center;
  font-size: 10px;
  color: #374151;
  background: white;
}


  .relation-box {
  margin-top: 14px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 11px;
  line-height: 1.5;
}

.relation-replace {
  background: #ede9fe;
  color: #5b21b6;
}

.relation-replaced {
  background: #fee2e2;
  color: #b91c1c;
}

.relation-credit {
  background: #fef3c7;
  color: #92400e;
}

.watermark {
  position: fixed;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-30deg);
  font-size: 90px;
  font-weight: 900;
  color: rgba(220, 38, 38, 0.12);
  z-index: 0;
  pointer-events: none;
}
</style>
</head>

<body>
<div class="pdf-page">

${
  status === "cancelled"
    ? `
<div class="watermark">ANNULÉE</div>
`
    : status === "replaced"
      ? `
<div class="watermark">REMPLACÉE</div>
`
      : (invoice as any).documentType === "CREDIT_NOTE"
        ? `
<div class="watermark">AVOIR</div>
`
        : ""
}

${headerHTML}

<div class="title">
  ${getDocumentTitle(status, (invoice as any).documentType)}
</div>
<div class="number">Numéro : ${safe(invoice.invoiceNumber)}</div>



<div class="client-block">
  <div class="client-name">${clientName}</div>
  <div>RCCM : ${clientRccm || "—"}</div>
  <div>idNat : ${clientIdNat || "—"}</div>
  <div>NIF : ${clientNif || "—"}</div>
  <div>${clientAddress || "—"}</div>
  <div><u>${clientCity}</u></div>

  <div class="issue-date">
    ${invoiceDateFormatted}
  </div>
</div>
${
  (invoice as any).correction?.replacesInvoiceNumber
    ? `
<div class="relation-box relation-replace">
  Cette facture annule et remplace la facture :
  <strong>
    ${(invoice as any).correction.replacesInvoiceNumber}
  </strong>
</div>
`
    : ""
}

${
  (invoice as any).correction?.replacedByInvoiceNumber
    ? `
<div class="relation-box relation-replaced">
  Cette facture a été remplacée par :
  <strong>
    ${(invoice as any).correction.replacedByInvoiceNumber}
  </strong>
</div>
`
    : ""
}

${
  (invoice as any).creditNoteForInvoiceNumber
    ? `
<div class="relation-box relation-credit">
  Avoir relatif à la facture :
  <strong>
    ${(invoice as any).creditNoteForInvoiceNumber}
  </strong>
</div>
`
    : ""
}
<div class="intro">
  ${
    isCreditNote
      ? "Vous trouverez ci-dessous l’avoir relatif à la facture concernée :"
      : "Vous trouverez ci-dessous la facture relative aux prestations convenues :"
  }
</div>

<table class="main-table">
  <colgroup>
    <col class="col-designation" />
    <col class="col-days" />
    <col class="col-qty" />
    <col class="col-pu-currency" />
    <col class="col-pu" />
    <col class="col-pt-currency" />
    <col class="col-pt" />
  </colgroup>

  <thead>
    <tr>
      <th>Désignation</th>
      <th>Jrs</th>
      <th>Quantité</th>
      <th colspan="2">P.U.</th>
      <th colspan="2">P.T.</th>
    </tr>
  </thead>

  <tbody>
    <tr class="event">
      <td>
        <strong>Evénement :</strong> ${eventName}<br/>
        ${
          servicePeriod
            ? `<strong>Période prestation :</strong> ${servicePeriod}<br/>`
            : `<strong>Date événement :</strong> ${eventDateFormatted}<br/>`
        }

${guestCountHtml}
      </td>
      <td></td>
      <td></td>
      <td colspan="2"></td>
      <td colspan="2"></td>
    </tr>

    ${rows}
  </tbody>
</table>

<div class="totals">
  <div class="subtotal">
    <div>Sous-total :</div>
<div>${currency}</div>
<div style="text-align:right;">
  ${formatMoneyByCurrency(displayedSubtotal, documentCurrency)}
</div>
  </div>

  ${
    discountAmount > 0
      ? `
  <div class="subtotal">
    <div>Remise :</div>
<div>${currency}</div>
<div style="text-align:right;">
  - ${formatMoneyByCurrency(displayedDiscountAmount, documentCurrency)}
</div>
  </div>
  `
      : ""
  }

  <div class="grand-total">
    <div>${isCreditNote ? "Montant de l’avoir :" : "Total à payer :"}</div>
<div>${currency}</div>
<div style="text-align:right;">
  ${formatMoneyByCurrency(displayedTotalAfterDiscount, documentCurrency)}
</div>
  </div>
  ${
    documentCurrency === "CDF"
      ? `
  <div style="text-align:right; font-size:10px; margin-top:5px; color:#6b7280;">
    Équivalent indicatif : USD ${money(totalAfterDiscount)}<br/>
    Taux appliqué : 1 USD = ${formatMoneyByCurrency(exchangeRate, "CDF")} CDF
  </div>
  `
      : ""
  }
</div>

${
  (invoice as any).cancellation?.reason
    ? `
<div class="relation-box relation-replaced">
  Motif d’annulation :
  <strong>
    ${(invoice as any).cancellation.reason}
  </strong>
</div>
`
    : ""
}

${
  isCreditNote
    ? `
<div class="payment">
  Cet avoir vient en déduction de la facture concernée.
</div>
`
    : `
<div class="payment-block">
  <div class="payment-title">
    Les paiements peuvent se faire en espèces, par chèque ou par virement bancaire - ${bankText}
  </div>

  <div class="payment-text">
    Les paiements par virement bancaire doivent se faire en mode OUR-prise en charge des frais par le donneur d'ordre- afin que l'intégralité de la facture soit encaissée par CREPOLIA; dans le cas contraire, la facture sera considérée non soldée.
  </div>

  <div class="payment-contact">
    Pour toute question sur la présente facture, vous pouvez contacter :
    ${companyEmail} – Tél. ${companyPhone}
  </div>

  <div class="payment-thanks">
    MERCI DE NOUS FAIRE CONFIANCE
  </div>
</div>
`
}

<div class="signature-area">
    <div class="stamp">
      ${assets?.stampBase64 ? `<img src="${assets.stampBase64}" />` : ""}
    </div>

    <div class="signature">
      ${assets?.signatureBase64 ? `<img src="${assets.signatureBase64}" />` : ""}
    </div>
  </div>

${footerHTML}

</div>
</body>
</html>
`;
}
