//src/utils/proformaHtml.ts
import { CateringProforma } from '@/src/services/cateringProforma.service';

type ProformaPdfAssets = {
  logoBase64?: string;
  stampBase64?: string;
  signatureBase64?: string;
};

function money(value?: number) {
  return Number(value || 0).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function safe(value?: string | null) {
  return value && value.trim() ? value.trim() : '';
}

function safeClientName(proforma: CateringProforma) {
  const name = safe(proforma.clientName);

  if (!name || name.toLowerCase() === 'client') {
    return 'NOM DU CLIENT À RENSEIGNER';
  }

  return name;
}

function toDate(value: any): Date | null {
  if (!value) return null;

  if (value?.toDate) return value.toDate();

  if (value instanceof Date) return value;

  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

// Date complète → mercredi 06/05/2026
function formatLongDate(value: any, lang: 'fr' | 'en' = 'fr') {
  const date = toDate(value);
  if (!date) return '—';

  const locale = lang === 'fr' ? 'fr-FR' : 'en-US';

  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Date courte → 06/05/2026
function formatShortDate(value: any, lang: 'fr' | 'en' = 'fr') {
  const date = toDate(value);
  if (!date) return '—';

  const locale = lang === 'fr' ? 'fr-FR' : 'en-US';

  return date.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function buildProformaHTML(
  proforma: CateringProforma,
  assets?: ProformaPdfAssets
): string {
  const rows = (proforma.items || [])
    .map(
      (item) => `
<tr>
  <td class="designation">${safe(item.label)}</td>
  <td class="center">${Number(item.numberOfDays || 1)}</td>
  <td class="center">${item.quantity || 0}</td>
  <td class="currency">$</td>
  <td class="price">${money(item.unitPrice)}</td>
  <td class="currency">$</td>
  <td class="price">${money(item.total)}</td>
</tr>`
    )
    .join('');

  const subtotal = proforma.totals?.subtotal ?? 0;
  const discount = proforma.totals?.discount ?? 0;
  const total = proforma.totals?.total ?? subtotal - discount;

  const clientName = safeClientName(proforma);
  const clientRccm = safe(proforma.clientRccm);
  const clientIdnat = safe(proforma.clientIdnat);
  const clientAddress = safe(proforma.clientAddress);
  const clientCity = safe(proforma.clientCity) || 'Kinshasa';
  const issueDateFormatted = formatLongDate(proforma.issueDate, 'fr');
  const eventDateFormatted = formatShortDate(proforma.eventDate, 'fr');
  const validityDateFormatted = formatShortDate(proforma.validityDate, 'fr');
  const clientNif = safe(proforma.clientNif);

  const menuRows =
    proforma.menu && proforma.menu.length > 0
      ? proforma.menu
        .map(
          (item, index) => `
<tr>
  <td class="center">${index + 1}</td>
  <td>
    ${safe(item.name)}
    ${item.notes
              ? `<br/><span class="dish-note">${safe(item.notes)}</span>`
              : ''
            }
  </td>
</tr>`
        )
        .join('')
      : `
<tr>
  <td class="center">1</td>
  <td>Menu à préciser lors de la confirmation de la commande</td>
</tr>`;

  const headerHTML = `
<div class="header">
  <div class="logo">
    ${assets?.logoBase64 ? `<img src="${assets.logoBase64}" />` : ''}
  </div>

  <div class="address">
    Tél. : +243 898111165<br/>
    contact@crepolia.com<br/>
    54, Avenue de la Justice<br/>
    C/Gombe
  </div>
</div>

<div class="top-line"></div>
`;

  const footerHTML = `
<div class="page-footer">
  RCCM : CD/KNG/RCCM/20-A-00139&nbsp;&nbsp;
  ID Nat : 01-852-N58548R&nbsp;&nbsp;
  NIF:A2171348B
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
}

* {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
  
body {
  margin: 0;
  padding: 0;
  color: #5f6368;
  font-size: 10px;
  font-family: 'Montserrat', Arial, sans-serif;
}

.pdf-page {
  position: relative;
  min-height: 1080px;
  padding: 10px 10px 30px 10px;
  page-break-after: always;
  break-after: page;
}

.pdf-page:last-child {
  page-break-after: auto;
  break-after: auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-left: 0px;
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
  font-weight: 300 !important;
  color: #374151;
}

.address * {
  font-weight: 400 !important;
}

.top-line {
  border-bottom: 1px solid #2f3b4f;
  margin-top: 0px;
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
  height: 82px;
  vertical-align: top;
  line-height: 1.65;
}

.main-table .event td:first-child {
  font-weight: 700;
}

.col-designation { width: 40%; }
.col-days { width: 10%; }
.col-qty { width: 12%; }
.col-pu-currency { width: 5%; }
.col-pu { width: 17%; }
.col-pt-currency { width: 5%; }
.col-pt { width: 16%; }

.designation {
  text-align: left;
}

.center {
  text-align: center;
}

.currency {
  text-align: center;
  border-right: none !important;
  padding-right: 0 !important;
}

.price {
  text-align: right;
  border-left: none !important;
  padding-left: 0 !important;
}
  .main-table td.currency + td.price {
  border-left: none !important;
}

.validity {
  margin-top: 3px;
  margin-left: 2px;
  font-size: 10px;
  font-style: italic;
  color: #555;
}

.totals {
  width: 49%;
  margin-left: auto;
  margin-top: 5px;
}

.subtotal {
  display: grid;
  grid-template-columns: 1fr 35px 115px;
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
  grid-template-columns: 1fr 35px 115px;
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

.payment strong {
  font-weight: 700;
  color: #4b5563;
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

.menu-title {
  margin-top: 26px;
  font-size: 16px;
  font-weight: 900;
  color: #3f4650;
  letter-spacing: 0.5px;
}

.menu-subtitle {
  margin-top: 6px;
  font-size: 10px;
  color: #6b7280;
}

.menu-client {
  margin-top: 24px;
  font-size: 11px;
  line-height: 1.6;
  color: #4b5563;
}

.menu-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 24px;
  table-layout: fixed;
}

.menu-table th {
  background: #6f9eb8;
  color: white;
  font-size: 12px;
  font-weight: 700;
  padding: 7px;
  border: 2px solid white;
  text-align: left;
}

.menu-table td {
  background: #dce8ee;
  color: #4b5563;
  font-size: 11px;
  padding: 8px;
  border: 2px solid white;
}

.dish-note {
  font-size: 9px;
  color: #555;
  font-style: italic;
}

.menu-note {
  margin-top: 24px;
  font-size: 10px;
  font-style: italic;
  line-height: 1.5;
  color: #6b7280;
}

.client-block div {
  margin-bottom: 2px;
}
</style>
</head>

<body>

<div class="pdf-page">
  ${headerHTML}

  <div class="title">PRO FORMA</div>
  <div class="number">Numéro : ${safe(proforma.number)}</div>

  <div class="client-block">
    <div class="client-name">${clientName}</div>

    <div>RCCM : ${clientRccm || '—'}</div>
    <div>IDNAT : ${clientIdnat || '—'}</div>
    <div>NIF : ${clientNif || '—'}</div>
    <div>${clientAddress || '—'}</div>
    <div><u>${clientCity} / RDC</u></div>

    <div class="issue-date">
      ${issueDateFormatted}
    </div>
  </div>

  <div class="intro">Vous trouverez ci-dessous pro-forma :</div>

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
          Evénement :<br/>
          Date événement : ${eventDateFormatted}<br/>
          Nbr de personnes : ${proforma.items?.[0]?.quantity || ''}
        </td>
        <td></td>
        <td></td>
        <td colspan="2"></td>
        <td colspan="2"></td>
      </tr>

      ${rows}
    </tbody>
  </table>

  <div class="validity">Date de validité : ${validityDateFormatted}</div>

  <div class="totals">
    <div class="subtotal">
      <div>Sous-total :</div>
      <div>$</div>
      <div style="text-align:right;">${money(subtotal)}</div>
    </div>

    ${discount > 0 ? `
<div class="subtotal">
  <div>Remise :</div>
  <div>$</div>
  <div style="text-align:right;">-${money(discount)}</div>
</div>
` : ''}

    <div class="grand-total">
      <div>Total à payer :</div>
      <div>$</div>
      <div style="text-align:right;">${money(total)}</div>
    </div>
  </div>

  <div class="payment">
    Un acompte de 70% est payable à la confirmation de la commande.
    Et la totalité sera soldée la veille de l’évènement.
  </div>

  <div class="signature-area">
    <div class="stamp">
      ${assets?.stampBase64 ? `<img src="${assets.stampBase64}" />` : ''}
    </div>

    <div class="signature">
      ${assets?.signatureBase64 ? `<img src="${assets.signatureBase64}" />` : ''}
    </div>
  </div>

  ${footerHTML}
</div>

${proforma.menu && proforma.menu.length > 0 ? `
<div class="pdf-page">
  ${headerHTML}

  <div class="menu-title">MENU DES PLATS</div>
  <div class="menu-subtitle">Annexe à la proforma : ${safe(proforma.number)}</div>

  <div class="menu-client">
    <strong>Client :</strong> ${clientName}<br/>
    <strong>Date événement :</strong> ${eventDateFormatted}<br/>
    <strong>Date proforma :</strong> ${issueDateFormatted}
  </div>

  <table class="menu-table">
    <thead>
      <tr>
        <th style="width: 12%; text-align:center;">N°</th>
        <th>Plat proposé</th>
      </tr>
    </thead>

    <tbody>
      ${menuRows}
    </tbody>
  </table>

  <div class="menu-note">
    Ce menu est proposé à titre indicatif et peut être ajusté selon les préférences du client,
    les contraintes opérationnelles et la disponibilité des produits.
  </div>

  ${footerHTML}
</div>
` : ''}

</body>
</html>
`;
}