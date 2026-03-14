import { CateringDocument } from "@/types/documents";

export function buildDocumentHTML(document: CateringDocument): string {

  const title =
    document.type === "invoice" ? "FACTURE" : "PRO FORMA";

  const rows = document.items
    .map((item) => {

      const unitPrice = Number(item.unitPrice).toLocaleString("fr-FR", {
        minimumFractionDigits: 2
      });

      const totalPrice = Number(item.totalPrice).toLocaleString("fr-FR", {
        minimumFractionDigits: 2
      });

      return `
<tr>
<td>${item.label}</td>
<td class="center">${item.days}</td>
<td class="center">${item.quantity}</td>
<td class="right">$ ${unitPrice}</td>
<td class="right">$ ${totalPrice}</td>
</tr>
`;
    })
    .join("");

  const subtotal = Number(document.totals.subtotal).toLocaleString("fr-FR", {
    minimumFractionDigits: 2
  });

  const total = Number(document.totals.total).toLocaleString("fr-FR", {
    minimumFractionDigits: 2
  });

  return `
<html>

<head>

<meta charset="utf-8"/>

<style>

@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap');

body{
font-family:'Montserrat',Arial;
padding:40px;
color:#1a1a1a;
font-size:13px;
}

/* HEADER */

.header{
display:flex;
justify-content:space-between;
align-items:flex-start;
}

.logo img{
height:70px;
}

.address{
text-align:right;
font-size:13px;
line-height:1.6;
}

.divider{
margin-top:15px;
margin-bottom:25px;
border-bottom:2px solid #bfc9d4;
}

/* TITLE + CLIENT */

.title-section{
margin-bottom:20px;
}

.title-left{
width:100%;
}

.title{
font-size:28px;
font-weight:700;
color:#2e4057;
margin-bottom:6px;
}

.title-row{
display:flex;
justify-content:space-between;
align-items:flex-start;
width:100%;
}

.number{
font-size:14px;
line-height:1.4;
}

.client{
text-align:right;
font-size:14px;
line-height:1.6;
max-width:280px;
}

/* COMMENT */

.comment{
margin-top:10px;
font-size:14px;
width:100%;
}

/* TABLE */

table{
width:100%;
border-collapse:collapse;
margin-top:20px;
}

thead{
background:#8fa6b6;
color:white;
}

th{
padding:10px;
font-size:13px;
text-align:left;
}

td{
border:1px solid #d5dde5;
padding:10px;
font-size:13px;
}

.center{
text-align:center;
}

.right{
text-align:right;
}

tbody tr:nth-child(even){
background:#eef3f7;
}

.event-info td{
background:#f5f8fb;
font-size:13px;
}

/* TOTALS */

.totals-wrapper{
margin-top:20px;
display:flex;
justify-content:flex-end;
}

.totals-table{
width:420px;
border-collapse:collapse;
font-size:16px;
}

.subtotal-row td{
background:#bfcbd4;
padding:12px;
border-top:3px solid black;
}

.total-row td{
background:#3a4556;
color:white;
font-weight:700;
padding:14px;
font-size:18px;
}

.label{
text-align:left;
}

.currency{
text-align:center;
width:40px;
}

.amount{
text-align:right;
width:140px;
}

/* PAYMENT */

.payment{
margin-top:30px;
text-align:center;
font-size:13px;
line-height:1.6;
color:#555;
}

.thankyou{
margin-top:20px;
text-align:center;
font-size:14px;
font-weight:600;
}

/* SIGNATURE */

.signature-section{
margin-top:30px;
display:flex;
justify-content:space-between;
align-items:center;
}

.signature img{
height:70px;
}

.stamp img{
height:90px;
}

/* FOOTER */

.footer{
margin-top:25px;
text-align:center;
font-size:12px;
color:#444;
}

</style>

</head>

<body>

<!-- HEADER -->

<div class="header">

<div class="logo">
<img src="${document.assets?.logoUri ?? ""}" />
</div>

<div class="address">
Tél. : +243 898111165<br/>
contact@crepolia.com<br/>
54, Avenue de la Justice<br/>
C/Gombe
</div>

</div>

<div class="divider"></div>

<!-- TITLE + CLIENT -->

<div class="title-section">

<div class="title-left">

<div class="title">${title}</div>

<div class="title-row">

<div class="number">
Numéro : ${document.meta.number ?? ""}
</div>

<div class="client">
<strong>${document.client.name ?? ""}</strong><br/>
${document.client.rccm ?? ""}<br/>
${document.client.idNat ?? ""}<br/>
${document.client.addressLine1 ?? ""}<br/>
${document.client.cityCountry ?? ""}<br/>
${document.meta.issueDate ?? ""}
</div>

</div>

</div>

</div>

<!-- COMMENT -->

<div class="comment">
Commentaires ou indications particulières :
${document.meta.comment ?? "Aucun"}
</div>

<!-- TABLE -->

<table>

<thead>

<tr>
<th>Désignation</th>
<th>Jrs</th>
<th>Quantité</th>
<th>P.U.</th>
<th>P.T.</th>
</tr>

</thead>

<tbody>

<tr class="event-info">
<td colspan="5">
Evènement : ${document.eventName ?? ""}<br/>
Date évènement : ${document.eventDate ?? ""}<br/>
Nbr de personnes : ${document.guestCount ?? ""}
</td>
</tr>

${rows}

</tbody>

</table>

<!-- TOTALS -->

<div class="totals-wrapper">

<table class="totals-table">

<tr class="subtotal-row">
<td class="label">Sous-total :</td>
<td class="currency">$</td>
<td class="amount">${subtotal}</td>
</tr>

<tr class="total-row">
<td class="label">Total à payer :</td>
<td class="currency">$</td>
<td class="amount">${total}</td>
</tr>

</table>

</div>

<!-- PAYMENT INFO -->

<div class="payment">

Les paiements peuvent se faire en espèces, par chèque ou par virement bancaire.<br/><br/>

Les paiements par virement bancaire doivent se faire en mode OUR (prise en charge
des frais par le donneur d'ordre) afin que l'intégralité de la facture soit encaissée
par CREPOLIA ; dans le cas contraire, la facture sera considérée non soldée.

</div>

<div class="thankyou">

MERCI DE NOUS FAIRE CONFIANCE

</div>

<!-- SIGNATURE -->

<div class="signature-section">

<div class="stamp">
<img src="${document.assets?.stampUri ?? ""}" />
</div>

<div class="signature">
<img src="${document.assets?.signatureUri ?? ""}" />
</div>

</div>

<!-- FOOTER -->

<div class="footer">

RCCM : CD/KNG/RCCM/20-A-00139<br/>
ID Nat : 01-852-N58548R<br/>
NIF : A2171348B

</div>

</body>

</html>
`;
}