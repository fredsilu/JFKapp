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
  return value && value.trim() ? value : '';
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
  <td class="center">1</td>
  <td class="center">${item.quantity || 0}</td>
  <td class="currency">$</td>
  <td class="price">${money(item.unitPrice)}</td>
  <td class="currency">$</td>
  <td class="price">${money(item.total)}</td>
</tr>`
    )
    .join('');

  const subtotal = proforma.totals?.subtotal ?? proforma.totals?.total ?? 0;
  const total = proforma.totals?.total ?? subtotal;

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />

<style>
@page {
  size: A4;
  margin: 0;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 28px 31px 22px 31px;
  font-family: Arial, Helvetica, sans-serif;
  color: #5f6368;
  font-size: 15px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.logo {
  width: 165px;
  height: 78px;
}

.logo img {
  width: 160px;
  max-height: 76px;
  object-fit: contain;
}

.address {
  text-align: right;
  font-size: 14px;
  line-height: 1.16;
  font-weight: 700;
  color: #374151;
}

.top-line {
  border-bottom: 2px solid #2f3b4f;
  margin-top: 8px;
}

.title {
  margin-top: 18px;
  font-size: 23px;
  font-weight: 700;
  color: #3f4650;
  letter-spacing: 0.5px;
}

.number {
  margin-top: 6px;
  font-size: 15px;
  color: #6b7280;
}

.client-block {
  text-align: right;
  margin-top: 10px;
  font-size: 15px;
  line-height: 1.42;
  color: #666;
}

.client-name {
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 1px;
}

.issue-date {
  margin-top: 22px;
  font-size: 15px;
}

.intro {
  margin-top: 25px;
  margin-bottom: 4px;
  font-size: 14px;
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
  font-size: 15px;
  font-weight: 400;
  padding: 4px 3px;
  border: 2px solid white;
  text-align: center;
}

.main-table td {
  background: #dce8ee;
  border: 2px solid white;
  padding: 3px 5px;
  font-size: 14px;
  color: #5f6368;
}

.main-table .event td {
  background: #c8dbe5;
  height: 82px;
  vertical-align: top;
  line-height: 1.65;
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
}

.price {
  text-align: right;
}

.validity {
  margin-top: 3px;
  margin-left: 2px;
  font-size: 14px;
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
  font-size: 17px;
  color: #555;
}

.grand-total {
  display: grid;
  grid-template-columns: 1fr 35px 115px;
  background: #2f3b4f;
  color: white;
  padding: 8px 10px;
  margin-top: 26px;
  font-size: 18px;
  font-weight: 700;
}

.payment {
  margin-top: 39px;
  border-top: 2px solid #9ca3af;
  padding-top: 8px;
  font-size: 14px;
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
  height: 145px;
}

.stamp {
  position: absolute;
  left: 25px;
  top: 8px;
}

.stamp img {
  width: 185px;
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

.bottom-line {
  border-bottom: 2px solid #2f3b4f;
  margin-top: 38px;
}

.footer {
  text-align: center;
  margin-top: 8px;
  font-size: 12px;
  color: #374151;
  font-weight: 700;
}
</style>
</head>

<body>

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

<div class="title">PRO FORMA</div>
<div class="number">Numéro : ${safe(proforma.number)}</div>

<div class="client-block">
  <div class="client-name">${safe(proforma.clientName) || 'CLIENT'}</div>
  <div>RCCM</div>
  <div>IDNAT</div>
  <div>C/GOMBE</div>
  <div><u>Kinshasa / RDC</u></div>
  <div class="issue-date">${safe(proforma.issueDate)}</div>
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
        Date événement : ${safe(proforma.eventDate)}<br/>
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

<div class="validity">Date de validité : ${safe(proforma.validityDate)}</div>

<div class="totals">
  <div class="subtotal">
    <div>Sous-total :</div>
    <div>$</div>
    <div style="text-align:right;">${money(subtotal)}</div>
  </div>

  <div class="grand-total">
    <div>Total à payer :</div>
    <div>$</div>
    <div style="text-align:right;">${money(total)}</div>
  </div>
</div>

<div class="payment">
  Un acompte de 70% est payable à la confirmation de la commande.
  Et la totalité sera soldée la <br/>
  <strong>veille de l’évènement.</strong>
</div>

<div class="signature-area">
  <div class="stamp">
    ${assets?.stampBase64 ? `<img src="${assets.stampBase64}" />` : ''}
  </div>

  <div class="signature">
    ${assets?.signatureBase64 ? `<img src="${assets.signatureBase64}" />` : ''}
  </div>
</div>

<div class="bottom-line"></div>

<div class="footer">
  RCCM : CD/KNG/RCCM/20-A-00139&nbsp;&nbsp;
  ID Nat : 01-852-N58548R&nbsp;&nbsp;
  NIF:A2171348B
</div>

</body>
</html>
`;
}