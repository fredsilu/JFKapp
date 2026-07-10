// scripts/recover-historical-invoices-v6.js 
// // // Objectif : 
// // 1) Lire toutes les factures historiques depuis le classeur Excel source. 
// 
// // 2)Scanner récursivement tous les PDF d’archives. 
// // 3) Faire un matching tolérant des numéros de facture. // 4) Comparer les documents trouvésavec Firestore. // 5) Produire un rapport Excel détaillé. // 6) Importer
//uniquement lorsque le script est lancé avec –import. // // Exemples : //node scripts/recover-historical-invoices-v6.js // node
//scripts/recover-historical-invoices-v6.js –dry-run // nodescripts/recover-historical-invoices-v6.js –import // node
//scripts/recover-historical-invoices-v6.js –import –limit=10 // nodescripts/recover-historical-invoices-v6.js –years=2025,2026

const admin = require("firebase-admin"); 
const fs = require("fs"); 
const path = require("path"); const crypto = require("crypto"); const XLSX =
require("xlsx");

require("dotenv").config({ path: ".env.production" });

const ARCHIVE_ROOT = process.env.ARCHIVE_ROOT ||
 "B:/Professionnel/Creperie/Clientele/Archives_Crepolia";

const INPUT_EXCEL_PATH = process.env.ARCHIVE_INPUT_EXCEL ||
path.join(ARCHIVE_ROOT, "audit_import_archives_v4.xlsx");

const CLIENT_MAPPING_PATH = process.env.ARCHIVE_CLIENT_MAPPING ||
path.join(ARCHIVE_ROOT, "archive_client_mapping_v1.xlsx");

const OUTPUT_REPORT_PATH = process.env.ARCHIVE_RECOVERY_REPORT ||
path.join(ARCHIVE_ROOT, "recovery_historical_invoices_v6_report.xlsx");

const SERVICE_ACCOUNT_PATH = path.resolve("serviceAccountKey.json");
const COLLECTION_NAME = "archived_documents"; const STORAGE_FOLDER =
"documents/archived-invoices";

const ARGS = process.argv.slice(2); const SHOULD_IMPORT =
ARGS.includes("--import"); const IS_DRY_RUN = ARGS.includes("--dry-run")
|| !SHOULD_IMPORT; const LIMIT = getNumericArg(“–limit”); const
YEAR_FILTER = getListArg(“–years”);

const INVOICE_NUMBER_REGEXES = [
/(?:facture|invoice)?[^a-z0-9](cr)?[^a-z0-9](20)[^a-z0-9](?:fc|facture)?[^a-z0-9]()/i,
/20)[^0-9]+()i,];

function getNumericArg(name) { const entry = ARGS.find((arg) =>
arg.startsWith(`${name}=`)); if (!entry) return undefined; const value =
Number(entry.split("=")[1]); return Number.isFinite(value) && value > 0
? value : undefined; }

function getListArg(name) { const entry = ARGS.find((arg) =>
arg.startsWith(`${name}=`)); if (!entry) return []; return entry
.split("=")[1] .split(",") .map((value) => value.trim())
.filter(Boolean); }

function initFirebase() { if (admin.apps.length > 0) return admin;

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) { throw new Error(
“serviceAccountKey.json introuvable à la racine du projet.” ); }

const storageBucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;

if (!storageBucket) { throw new
Error(“EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET manquant.”); }

admin.initializeApp({ credential:
admin.credential.cert(require(SERVICE_ACCOUNT_PATH)), storageBucket, });

return admin; }

function cleanString(value) { const text = String(value ?? ““).trim();
return text || undefined; }

function normalizeText(value) { return String(value ?? ““)
.toLowerCase() .normalize(”NFD”) .replace(/[300-36f]/g, ““)
.replace(/[^a-z0-9]+/g,” “) .trim(); }

function normalizeClientName(value) { return normalizeText(value)
.replace(/sarl|sprl|sa|ltd|llc|inc|rdc|drc|kinshasa|kin)g, ““)
.replace(/+/g,”“) .trim(); }

function padSequence(value) { const parsed = Number(String(value ||
““).replace(//g,”“)); if (!Number.isFinite(parsed)) return undefined;
return String(parsed).padStart(3,”0”); }

function extractInvoiceIdentity(value) { const raw = cleanString(value);
if (!raw) return undefined;

const withoutExtension = raw.replace(/.[a-z0-9]{1,5}$/i, ““);

for (const regex of INVOICE_NUMBER_REGEXES) { const match =
withoutExtension.match(regex); if (!match) continue;

    let year;
    let sequence;

    if (match.length >= 4) {
      year = match[2];
      sequence = match[3];
    } else {
      year = match[1];
      sequence = match[2];
    }

    const padded = padSequence(sequence);
    if (!year || !padded) continue;

    return {
      year: String(year),
      sequence: padded,
      key: `CR${year}-FC-${padded}`,
      displayNumber: `facture_CR${year}_FC_${padded}`,
    };

}

return undefined; }

function getRowInvoiceIdentity(row) { const candidates = [ row.number,
row.invoiceNumber, row.numero, row.numFacture, row.facture,
row.fileName, row.filePath, row.designation, ];

for (const candidate of candidates) { const identity =
extractInvoiceIdentity(candidate); if (identity) return identity; }

return undefined; }

function cleanAmount(value) { if (value === “” || value === null ||
value === undefined) return undefined;

const normalized = String(value) .replace(//g, ““)
.replace(/.(?=(?:|$))/g,”“) .replace(”,“,”.”) .replace(/[^0-9.-]/g, ““);

const amount = Number(normalized); return Number.isFinite(amount) ?
amount : undefined; }

function excelDateToISO(value) { if (!value) return undefined;

if (typeof value === “number”) { const parsed =
XLSX.SSF.parse_date_code(value); if (!parsed) return undefined; return
${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(       parsed.d     ).padStart(2, "0")};
}

const text = String(value).trim(); if (!text) return undefined; if
([“ok”, “annulé”, “annule”, “x”, “-”].includes(text.toLowerCase())) {
return undefined; }

if (/^--$/.test(text)) return text;

const frenchMatch = text.match(/^()/.-/.-$/);
  if (frenchMatch) {
    return `${frenchMatch[3]}-${String(frenchMatch[2]).padStart(
      2,
      "0"
    )}-${String(frenchMatch[1]).padStart(2, “0”)}`; }

const parsed = new Date(text); return Number.isNaN(parsed.getTime()) ?
undefined : parsed.toISOString().slice(0, 10); }

function isCreditNoteRow(row, filePath) { const text = normalizeText( [
row.number, row.invoiceNumber, row.clientExcel, row.clientFolder,
row.fileName, row.designation, filePath, ].join(” “) );

const amount = cleanAmount(row.amount ?? row.montant); return
text.includes(“avoir”) || (amount !== undefined && amount < 0); }

function removeUndefined(payload) { for (const key of
Object.keys(payload)) { if (payload[key] === undefined) delete
payload[key]; } return payload; }

function sanitizeFileName(value) { return String(value || ““) .trim()
.replace(/[^\w.-]+/g,”_“) .replace(/+/g, ””); }

function hashFile(filePath) { const hash = crypto.createHash(“sha1”);
hash.update(fs.readFileSync(filePath)); return hash.digest(“hex”); }

function walkPdfFiles(rootDirectory) { const results = [];

function visit(currentPath) { const entries =
fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        const normalized = normalizeText(fullPath);
        if (
          normalized.includes("node modules") ||
          normalized.includes("firebase") ||
          normalized.includes("storage emulator")
        ) {
          continue;
        }
        visit(fullPath);
        continue;
      }

      if (entry.isFile() && entry.name.toLowerCase().endsWith(".pdf")) {
        const stat = fs.statSync(fullPath);
        results.push({
          filePath: fullPath,
          fileName: entry.name,
          size: stat.size,
          modifiedAt: stat.mtime.toISOString(),
          identity:
            extractInvoiceIdentity(entry.name) || extractInvoiceIdentity(fullPath),
        });
      }
    }

}

visit(rootDirectory); return results; }

function readAllWorkbookRows(workbook) { const allRows = [];

for (const sheetName of workbook.SheetNames) { const sheet =
workbook.Sheets[sheetName]; const rows = XLSX.utils.sheet_to_json(sheet,
{ defval: “” });

    rows.forEach((row, index) => {
      allRows.push({
        ...row,
        __sheetName: sheetName,
        __rowNumber: index + 2,
      });
    });

}

return allRows; }

function looksLikeInvoiceRow(row) { const identity =
getRowInvoiceIdentity(row); if (!identity) return false;

const sheetName = normalizeText(row.__sheetName); const rowText =
normalizeText( [row.number, row.invoiceNumber, row.fileName,
row.designation].join(” “) );

if (sheetName.includes(“proforma”) && !sheetName.includes(“invoice”)) {
return false; }

if (rowText.includes(“proforma”) && !rowText.includes(“facture”)) {
return false; }

return true; }

function chooseBestExcelRow(rows) { return […rows].sort((a, b) =>
scoreExcelRow(b) - scoreExcelRow(a))[0]; }

function scoreExcelRow(row) { let score = 0; if
(cleanString(row.clientExcel ?? row.clientName ?? row.clientFolder))
score += 4; if (cleanString(row.designation)) score += 3; if
(cleanAmount(row.amount ?? row.montant) !== undefined) score += 3; if
(excelDateToISO(row.invoiceDate ?? row.documentDate)) score += 3; if
(excelDateToISO(row.eventDate)) score += 1; if
(cleanString(row.filePath)) score += 2; if
(normalizeText(row.__sheetName).includes("matched invoice")) score += 2;
return score; }

function chooseBestPdf(files, row) { const expectedClient =
normalizeClientName( row.clientExcel ?? row.clientName ??
row.clientFolder );

return […files].sort((a, b) => { const scoreA = scorePdf(a,
expectedClient); const scoreB = scorePdf(b, expectedClient); if (scoreA
!== scoreB) return scoreB - scoreA; if (a.size !== b.size) return
b.size - a.size; return a.filePath.localeCompare(b.filePath); })[0]; }

function scorePdf(file, expectedClient) { let score = 0; const
normalizedPath = normalizeClientName(file.filePath); const
normalizedName = normalizeText(file.fileName);

if (file.size > 0) score += 5; if (normalizedName.includes(“facture”))
score += 2; if (normalizedName.includes(“avoir”)) score -= 1; if
(expectedClient && normalizedPath.includes(expectedClient)) score += 4;
return score; }

function loadClientMapping() { if (!fs.existsSync(CLIENT_MAPPING_PATH))
return new Map();

const workbook = XLSX.readFile(CLIENT_MAPPING_PATH); const sheetName =
workbook.SheetNames.find( (name) => normalizeText(name) === “client
mapping” ); if (!sheetName) return new Map();

const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
defval: ““, });

const mapping = new Map();

for (const row of rows) { const finalClientName =
cleanString(row.finalClientName); if (!finalClientName) continue;

    const aliases = [
      row.historicalGroupName,
      ...String(row.aliases || "").split("|"),
    ];

    for (const alias of aliases) {
      const key = normalizeClientName(alias);
      if (key) mapping.set(key, finalClientName);
    }

}

return mapping; }

async function loadClientsByName(db) { const snap = await
db.collection(“clients”).get(); const map = new Map();

for (const doc of snap.docs) { const data = doc.data(); const name =
cleanString(data.name); if (!name) continue;
map.set(normalizeClientName(name), { id: doc.id, name }); }

return map; }

function resolveClient(row, clientsByName, clientMapping) { const
candidates = [ row.clientExcel, row.clientName, row.clientFolder,
row.historicalClientName, ] .map(cleanString) .filter(Boolean);

for (const candidate of candidates) { const normalized =
normalizeClientName(candidate); const mappedName =
clientMapping.get(normalized);

    if (mappedName) {
      const mappedClient = clientsByName.get(normalizeClientName(mappedName));
      if (mappedClient) {
        return {
          clientId: mappedClient.id,
          clientName: mappedClient.name,
          historicalClientName: candidate,
          clientMatchStatus: "mapped",
        };
      }

      return {
        clientName: mappedName,
        historicalClientName: candidate,
        clientMatchStatus: "new_historical_client",
      };
    }

    const directClient = clientsByName.get(normalized);
    if (directClient) {
      return {
        clientId: directClient.id,
        clientName: directClient.name,
        historicalClientName: candidate,
        clientMatchStatus: "direct",
      };
    }

}

return { clientName: candidates[0] || ““, historicalClientName:
candidates[0], clientMatchStatus:”unmapped”, }; }

async function loadExistingArchiveIndex(db) { const snap = await
db.collection(COLLECTION_NAME).get(); const index = new Map();

for (const doc of snap.docs) { const data = doc.data(); if (![“invoice”,
“credit_note”].includes(data.type)) continue;

    const identity = extractInvoiceIdentity(data.number);
    if (!identity) continue;

    const list = index.get(identity.key) || [];
    list.push({ id: doc.id, ...data });
    index.set(identity.key, list);

}

return index; }

async function uploadPdf(bucket, identity, pdf) { if (!pdf?.filePath ||
!fs.existsSync(pdf.filePath)) { throw new
Error(PDF introuvable pour ${identity.key}); }

if (pdf.size <= 0) { throw new
Error(PDF vide pour ${identity.key}: ${pdf.filePath}); }

const safeNumber = sanitizeFileName(identity.displayNumber); const
storagePath = ${STORAGE_FOLDER}/${safeNumber}.pdf;

if (IS_DRY_RUN) { return { pdfUrl: DRY_RUN_URL/${storagePath},
storagePath, }; }

await bucket.upload(pdf.filePath, { destination: storagePath, metadata:
{ contentType: “application/pdf”, metadata: { originalFileName:
pdf.fileName, recoveryVersion: “v6”, }, }, });

const file = bucket.file(storagePath); const [url] = await
file.getSignedUrl({ action: “read”, expires: “03-01-2500”, });

return { pdfUrl: url, storagePath }; }

function buildPayload(row, identity, pdf, uploadResult, client) { const
creditNote = isCreditNoteRow(row, pdf.filePath); const rawAmount =
cleanAmount(row.amount ?? row.montant); const invoiceDate =
excelDateToISO( row.invoiceDate ?? row.documentDate ?? row.dateFacture
); const eventDate = excelDateToISO(row.eventDate ?? row.dateEvenement);

return removeUndefined({ type: creditNote ? “credit_note” : “invoice”,
number: identity.displayNumber, normalizedNumber: identity.key,

    clientId: client.clientId,
    clientName: client.clientName || "",
    historicalClientName: client.historicalClientName,
    clientMatchStatus: client.clientMatchStatus,

    designation: cleanString(row.designation ?? row.eventName ?? row.service),
    documentDate: invoiceDate || eventDate,
    invoiceDate,
    eventDate,
    paymentDate: excelDateToISO(row.paymentDate),

    amount:
      rawAmount === undefined
        ? undefined
        : creditNote
        ? Math.abs(rawAmount)
        : rawAmount,
    currency: cleanString(row.currency) || "USD",

    reason: creditNote ? "Avoir historique récupéré automatiquement" : undefined,

    fileName: pdf.fileName,
    sourceFilePath: pdf.filePath,
    sourceFileHash: hashFile(pdf.filePath),
    pdfUrl: uploadResult.pdfUrl,
    storagePath: uploadResult.storagePath,

    source: "historical_import",
    importBatch: "recovery_historical_invoices_v6",
    importStatus: "complete",
    auditVersion: "v6_full_rescan",
    sourceSheet: row.__sheetName,
    sourceRowNumber: row.__rowNumber,

    metadataStatus:
      cleanString(row.designation) && (invoiceDate || eventDate)
        ? "complete"
        : "missing_info",
    isMetadataVerified: false,
    internalNote: "Récupéré par scan complet Excel + PDF V6",
    metadataVersion: 1,

    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    importedAt: admin.firestore.FieldValue.serverTimestamp(),

}); }

function appendWorksheet(workbook, data, name) { const safeData =
data.length ? data : [{ info: “Aucune donnée” }];
XLSX.utils.book_append_sheet( workbook,
XLSX.utils.json_to_sheet(safeData), name.slice(0, 31) ); }

async function main() { console.log(“===== RECOVERY HISTORICAL INVOICES
V6 =====”); console.log(“Mode import:”, SHOULD_IMPORT); console.log(“Dry
run:”, IS_DRY_RUN); console.log(“Excel:”, INPUT_EXCEL_PATH);
console.log(“Racine PDF:”, ARCHIVE_ROOT); console.log(“Rapport:”,
OUTPUT_REPORT_PATH);

if (!fs.existsSync(INPUT_EXCEL_PATH)) { throw new
Error(Fichier Excel introuvable : ${INPUT_EXCEL_PATH}); }

if (!fs.existsSync(ARCHIVE_ROOT)) { throw new
Error(Dossier d'archives introuvable : ${ARCHIVE_ROOT}); }

const firebase = initFirebase(); const db = firebase.firestore(); const
bucket = firebase .storage()
.bucket(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET);

const [clientsByName, existingIndex] = await Promise.all([
loadClientsByName(db), loadExistingArchiveIndex(db), ]); const
clientMapping = loadClientMapping();

const workbook = XLSX.readFile(INPUT_EXCEL_PATH); const allRows =
readAllWorkbookRows(workbook); const invoiceRows =
allRows.filter(looksLikeInvoiceRow); const pdfFiles =
walkPdfFiles(ARCHIVE_ROOT).filter((file) => file.identity);

console.log(“Lignes Excel totales:”, allRows.length);
console.log(“Lignes factures reconnues:”, invoiceRows.length);
console.log(“PDF factures reconnus:”, pdfFiles.length);

const excelByKey = new Map(); for (const row of invoiceRows) { const
identity = getRowInvoiceIdentity(row); if (!identity) continue; if
(YEAR_FILTER.length && !YEAR_FILTER.includes(identity.year)) continue;

    const list = excelByKey.get(identity.key) || [];
    list.push(row);
    excelByKey.set(identity.key, list);

}

const pdfByKey = new Map(); for (const pdf of pdfFiles) { if
(!pdf.identity) continue; if (YEAR_FILTER.length &&
!YEAR_FILTER.includes(pdf.identity.year)) continue;

    const list = pdfByKey.get(pdf.identity.key) || [];
    list.push(pdf);
    pdfByKey.set(pdf.identity.key, list);

}

const allKeys = new Set([…excelByKey.keys(), …pdfByKey.keys()]); const
sortedKeys = […allKeys].sort((a, b) => a.localeCompare(b, “fr”, {
numeric: true }));

const auditRows = []; const alreadyInFirestore = []; const missingPdf =
[]; const pdfWithoutExcel = []; const duplicateCandidates = []; const
readyToImport = []; const imported = []; const failed = [];

for (const key of sortedKeys) { const excelCandidates =
excelByKey.get(key) || []; const pdfCandidates = pdfByKey.get(key) ||
[]; const firestoreCandidates = existingIndex.get(key) || [];

    if (!excelCandidates.length && pdfCandidates.length) {
      pdfWithoutExcel.push(
        ...pdfCandidates.map((pdf) => ({
          normalizedNumber: key,
          fileName: pdf.fileName,
          filePath: pdf.filePath,
          size: pdf.size,
          reason: "PDF reconnu sans ligne Excel correspondante",
        }))
      );
      continue;
    }

    if (!excelCandidates.length) continue;

    const row = chooseBestExcelRow(excelCandidates);
    const identity = getRowInvoiceIdentity(row);
    const pdf = pdfCandidates.length ? chooseBestPdf(pdfCandidates, row) : undefined;

    if (excelCandidates.length > 1 || pdfCandidates.length > 1 || firestoreCandidates.length > 1) {
      duplicateCandidates.push({
        normalizedNumber: key,
        excelCandidates: excelCandidates.length,
        pdfCandidates: pdfCandidates.length,
        firestoreCandidates: firestoreCandidates.length,
        chosenSheet: row.__sheetName,
        chosenRow: row.__rowNumber,
        chosenPdf: pdf?.filePath || "",
      });
    }

    const audit = {
      normalizedNumber: key,
      displayNumber: identity?.displayNumber || "",
      year: identity?.year || "",
      sequence: identity?.sequence || "",
      sourceSheet: row.__sheetName,
      sourceRow: row.__rowNumber,
      clientExcel:
        cleanString(row.clientExcel ?? row.clientName ?? row.clientFolder) || "",
      designation: cleanString(row.designation) || "",
      amount: cleanAmount(row.amount ?? row.montant),
      invoiceDate: excelDateToISO(
        row.invoiceDate ?? row.documentDate ?? row.dateFacture
      ),
      pdfFound: Boolean(pdf),
      pdfFileName: pdf?.fileName || "",
      pdfFilePath: pdf?.filePath || "",
      pdfSize: pdf?.size || 0,
      firestoreFound: firestoreCandidates.length > 0,
      firestoreCount: firestoreCandidates.length,
      status: "",
    };

    if (firestoreCandidates.length > 0) {
      audit.status = "already_in_firestore";
      alreadyInFirestore.push({
        ...audit,
        firestoreIds: firestoreCandidates.map((item) => item.id).join(" | "),
        firestoreNumbers: firestoreCandidates
          .map((item) => item.number)
          .join(" | "),
      });
      auditRows.push(audit);
      continue;
    }

    if (!pdf) {
      audit.status = "missing_pdf";
      missingPdf.push({
        ...audit,
        reason: "Aucun PDF reconnu après normalisation du numéro",
      });
      auditRows.push(audit);
      continue;
    }

    audit.status = "ready_to_import";
    readyToImport.push({ row, identity, pdf, audit });
    auditRows.push(audit);

}

const importQueue = LIMIT ? readyToImport.slice(0, LIMIT) :
readyToImport;

for (const item of importQueue) { const { row, identity, pdf, audit } =
item;

    try {
      const creditNote = isCreditNoteRow(row, pdf.filePath);
      const expectedType = creditNote ? "credit_note" : "invoice";
      const exactExisting = (existingIndex.get(identity.key) || []).some(
        (doc) => doc.type === expectedType
      );

      if (exactExisting) {
        alreadyInFirestore.push({
          ...audit,
          status: "already_in_firestore_recheck",
        });
        continue;
      }

      console.log(
        `${IS_DRY_RUN ? "🔎" : "📤"} ${identity.key} | ${
          row.clientExcel || row.clientName || ""
        } | ${pdf.fileName}`
      );

      const client = resolveClient(row, clientsByName, clientMapping);
      const uploadResult = await uploadPdf(bucket, identity, pdf);
      const payload = buildPayload(
        row,
        identity,
        pdf,
        uploadResult,
        client
      );

      let firestoreId = "DRY_RUN";
      if (!IS_DRY_RUN) {
        const ref = await db.collection(COLLECTION_NAME).add(payload);
        firestoreId = ref.id;
      }

      imported.push({
        ...audit,
        type: payload.type,
        clientName: payload.clientName,
        clientMatchStatus: payload.clientMatchStatus,
        storagePath: uploadResult.storagePath,
        firestoreId,
        status: IS_DRY_RUN ? "dry_run_ok" : "imported",
      });
    } catch (error) {
      failed.push({
        ...audit,
        error: error.message,
      });
      console.error(`❌ ${identity.key}:`, error.message);
    }

}

const summary = [ { indicateur: “Mode”, valeur: IS_DRY_RUN ? “audit /
dry-run” : “import réel” }, { indicateur: “Lignes Excel totales”,
valeur: allRows.length }, { indicateur: “Lignes factures reconnues”,
valeur: invoiceRows.length }, { indicateur: “PDF factures reconnus”,
valeur: pdfFiles.length }, { indicateur: “Numéros uniques analysés”,
valeur: sortedKeys.length }, { indicateur: “Déjà dans Firestore”,
valeur: alreadyInFirestore.length }, { indicateur: “Prêtes à importer”,
valeur: readyToImport.length }, { indicateur: “Traitées dans cette
exécution”, valeur: importQueue.length }, { indicateur: “Importées /
dry-run OK”, valeur: imported.length }, { indicateur: “PDF manquants”,
valeur: missingPdf.length }, { indicateur: “PDF sans ligne Excel”,
valeur: pdfWithoutExcel.length }, { indicateur: “Doublons potentiels”,
valeur: duplicateCandidates.length }, { indicateur: “Erreurs”, valeur:
failed.length }, ];

const report = XLSX.utils.book_new(); appendWorksheet(report, summary,
“summary”); appendWorksheet(report, auditRows, “full_audit”);
appendWorksheet(report, imported, “imported_or_dry_run”);
appendWorksheet(report, readyToImport.map((item) => item.audit),
“ready_to_import”); appendWorksheet(report, alreadyInFirestore,
“already_in_firestore”); appendWorksheet(report, missingPdf,
“missing_pdf”); appendWorksheet(report, pdfWithoutExcel,
“pdf_without_excel”); appendWorksheet(report, duplicateCandidates,
“duplicate_candidates”); appendWorksheet(report, failed, “failed”);

XLSX.writeFile(report, OUTPUT_REPORT_PATH);

console.log(“===== RÉSUMÉ =====”); console.table(summary);
console.log(“Rapport généré :”, OUTPUT_REPORT_PATH); console.log(
IS_DRY_RUN ? “Aucune écriture effectuée. Relance avec –import après
vérification du rapport.” : “Import terminé. Vérifie les onglets
imported_or_dry_run et failed.” ); }

main().catch((error) => { console.error(“Erreur fatale:”, error);
process.exit(1); });