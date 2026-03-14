import { CateringDocument } from "@/types/documents";

export function buildDocumentHTML(document: CateringDocument): string {

  const title =
    document.type === "invoice" ? "FACTURE" : "PRO FORMA";

  const rows = document.items
    .map(
      (item) => `
<tr>
<td>${item.label}</td>
<td>${item.days}</td>
<td>${item.quantity}</td>
<td>${item.unitPrice}</td>
<td>${item.totalPrice}</td>
</tr>
`
    )
    .join("");

  return `
<html>

<head>

<meta charset="utf-8"/>

<style>

@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap');

body{
font-family: 'Montserrat', Arial;
padding:40px;
color:#1a1a1a;
}

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
margin-top:20px;
margin-bottom:25px;
border-bottom:2px solid #e6e6e6;
}

.title-section{
display:flex;
justify-content:space-between;
align-items:flex-start;
margin-bottom:20px;
}

.title{
font-size:26px;
font-weight:700;
color:#1F3A5F;
}

.number{
margin-top:5px;
font-size:14px;
}

.client{
text-align:right;
font-size:14px;
line-height:1.6;
}

table{
width:100%;
border-collapse:collapse;
margin-top:20px;
}

th{
background:#1F3A5F;
color:white;
padding:10px;
font-size:13px;
}

td{
border:1px solid #e6e6e6;
padding:10px;
font-size:13px;
}

tbody tr:nth-child(even){
background:#f5f8fb;
}

.total-box{
margin-top:25px;
display:flex;
justify-content:flex-end;
}

.total{
background:#1F3A5F;
color:white;
padding:12px 18px;
font-size:16px;
font-weight:700;
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

CREPOLIA<br/>
54 Avenue de la Justice<br/>
Gombe – Kinshasa<br/>
RDC<br/>
Tel : +243 891111165<br/>
contact@crepolia.com

</div>

</div>

<div class="divider"></div>

<!-- TITLE + CLIENT -->

<div class="title-section">

<div>

<div class="title">${title}</div>

<div class="number">
Numéro : ${document.meta.number ?? ""}
</div>

<div class="number">
Date : ${document.meta.issueDate}
</div>

</div>

<div class="client">

<strong>${document.client.name}</strong><br/>

${document.client.addressLine1 ?? ""}<br/>
${document.client.cityCountry ?? ""}

</div>

</div>

<!-- EVENT -->

<div style="margin-top:10px;font-size:14px;">

Evènement : ${document.eventName ?? ""}<br/>
Nombre de personnes : ${document.guestCount}

</div>

<!-- TABLE -->

<table>

<thead>

<tr>
<th>Désignation</th>
<th>Jrs</th>
<th>Qté</th>
<th>P.U</th>
<th>P.T</th>
</tr>

</thead>

<tbody>

${rows}

</tbody>

</table>

<!-- TOTAL -->

<div class="total-box">

<div class="total">

TOTAL : ${document.totals.total} USD

</div>

</div>

</body>

</html>
`;
}