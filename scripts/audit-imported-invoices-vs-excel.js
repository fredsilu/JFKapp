const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const EXCEL_PATH =
  "B:/Professionnel/Creperie/Clientele/Archives_Crepolia/audit_import_archives_v4.xlsx";

const OUTPUT_PATH =
  "B:/Professionnel/Creperie/Clientele/Archives_Crepolia/audit_firestore_vs_matched_invoices.xlsx";

const SERVICE_ACCOUNT_PATH = path.resolve("serviceAccountKey.json");
const COLLECTION_NAME = "archived_documents";

function normalizeNumber(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\.[^.]+$/i, "")
    .replace(/\s+/g, "_")
    .replace(/-/g, "_")
    .replace(/\./g, "_")
    .replace(/_+/g, "_");
}

function initFirebase() {
  if (admin.apps.length > 0) return admin;

  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    throw new Error("serviceAccountKey.json introuvable.");
  }

  admin.initializeApp({
    credential: admin.credential.cert(require(SERVICE_ACCOUNT_PATH)),
  });

  return admin;
}

function appendWorksheet(workbook, data, sheetName) {
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(data.length ? data : [{ info: "Aucune donnée" }]),
    sheetName
  );
}

async function main() {
  console.log("Lecture Excel matched_invoices...");

  const workbook = XLSX.readFile(EXCEL_PATH);
  const matchedInvoices = XLSX.utils.sheet_to_json(
    workbook.Sheets["matched_invoices"],
    { defval: "" }
  );

  console.log("Factures Excel matched_invoices :", matchedInvoices.length);

  const firebase = initFirebase();
  const db = firebase.firestore();

  console.log("Lecture Firestore archived_documents...");
  const snap = await db
    .collection(COLLECTION_NAME)
    .where("type", "==", "invoice")
    .get();

  const firestoreInvoices = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  console.log("Factures Firestore :", firestoreInvoices.length);

  const firestoreByNumber = new Map();

  for (const doc of firestoreInvoices) {
    const key = normalizeNumber(doc.number);
    if (!key) continue;

    if (!firestoreByNumber.has(key)) {
      firestoreByNumber.set(key, []);
    }

    firestoreByNumber.get(key).push(doc);
  }

  const imported = [];
  const missing = [];

  for (const row of matchedInvoices) {
    const key = normalizeNumber(row.number);

    if (firestoreByNumber.has(key)) {
      imported.push({
        number: row.number,
        normalizedNumber: row.normalizedNumber,
        clientExcel: row.clientExcel,
        fileName: row.fileName,
        status: "imported",
        firestoreCount: firestoreByNumber.get(key).length,
      });
    } else {
      missing.push({
        number: row.number,
        normalizedNumber: row.normalizedNumber,
        clientExcel: row.clientExcel,
        fileName: row.fileName,
        filePath: row.filePath,
        amount: row.amount,
        invoiceDate: row.invoiceDate,
        eventDate: row.eventDate,
        reason: "Présente dans matched_invoices mais absente de Firestore",
      });
    }
  }

  const excelNumbers = new Set(
    matchedInvoices.map((row) => normalizeNumber(row.number)).filter(Boolean)
  );

  const extraInFirestore = firestoreInvoices
    .filter((doc) => !excelNumbers.has(normalizeNumber(doc.number)))
    .map((doc) => ({
      firestoreId: doc.id,
      number: doc.number,
      clientName: doc.clientName,
      fileName: doc.fileName,
      amount: doc.amount,
      documentDate: doc.documentDate,
      invoiceDate: doc.invoiceDate,
      eventDate: doc.eventDate,
      importBatch: doc.importBatch,
    }));

  const summary = [
    { indicateur: "Factures Excel matched_invoices", valeur: matchedInvoices.length },
    { indicateur: "Factures Firestore", valeur: firestoreInvoices.length },
    { indicateur: "Factures importées selon comparaison", valeur: imported.length },
    { indicateur: "Factures manquantes", valeur: missing.length },
    { indicateur: "Factures Firestore hors Excel", valeur: extraInFirestore.length },
  ];

  const outputWorkbook = XLSX.utils.book_new();

  appendWorksheet(outputWorkbook, summary, "summary");
  appendWorksheet(outputWorkbook, missing, "missing_in_firestore");
  appendWorksheet(outputWorkbook, imported, "imported");
  appendWorksheet(outputWorkbook, extraInFirestore, "extra_in_firestore");

  XLSX.writeFile(outputWorkbook, OUTPUT_PATH);

  console.log("===== RÉSUMÉ =====");
  console.table(summary);
  console.log("Rapport généré :", OUTPUT_PATH);
}

main().catch((error) => {
  console.error("Erreur fatale:", error);
  process.exit(1);
});