import { CateringDocument } from "@/types/documents";

export function buildDocumentHTML(document: CateringDocument): string {

  const title =
    document.type === "proforma" ? "PRO FORMA" : "FACTURE";

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

body{
font-family: Arial;
padding:40px;
}

h1{
text-align:center;
}

table{
width:100%;
border-collapse:collapse;
margin-top:20px;
}

th,td{
border:1px solid #ccc;
padding:8px;
text-align:left;
}

.total{
margin-top:20px;
text-align:right;
font-size:18px;
font-weight:bold;
}

.header{
display:flex;
justify-content:space-between;
margin-bottom:20px;
}

.client{
margin-top:20px;
}

</style>

</head>

<body>

<div class="header">

<div>

<h2>CREPOLIA</h2>

<div>
54 Avenue de la Justice<br/>
Gombe – Kinshasa<br/>
RDC
</div>

</div>

<div>

<h1>${title}</h1>

<div>
Numéro : ${document.meta.number || ""}
</div>

<div>
Date : ${document.meta.issueDate}
</div>

</div>

</div>

<div class="client">

<strong>Client :</strong><br/>

${document.client.name}<br/>
${document.client.addressLine1 ?? ""}<br/>
${document.client.cityCountry ?? ""}

</div>


<div style="margin-top:20px">

Evénement : ${document.eventName}<br/>
Nombre de personnes : ${document.guestCount}

</div>

<table>

<tr>
<th>Désignation</th>
<th>Jrs</th>
<th>Qté</th>
<th>P.U</th>
<th>P.T</th>
</tr>

${rows}

</table>

<div class="total">
Total : ${document.totals.total} USD
</div>

</body>

</html>
`;
}