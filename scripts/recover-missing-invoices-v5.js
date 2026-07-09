//scripts/recover-missing-invoices-v5.js

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

require("dotenv").config({ path: ".env.production" });

const INPUT_PATH =
  "B:/Professionnel/Creperie/Clientele/Archives_Crepolia/audit_firestore_vs_matched_invoices.xlsx";

const OUTPUT_PATH =
  "B:/Professionnel/Creperie/Clientele/Archives_Crepolia/recovery_missing_invoices_v5_report.xlsx";

const SERVICE_ACCOUNT_PATH = path.resolve("serviceAccountKey.json");
const COLLECTION_NAME = "archived_documents";

const IS_DRY_RUN = process.argv.includes("--dry-run");

function initFirebase() {
  if (admin.apps.length > 0) return admin;

  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    throw new Error("serviceAccountKey.json introuvable à la racine du projet.");
  }

  const storageBucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (!storageBucket) {
    throw new Error("EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET manquant.");
  }

  admin.initializeApp({
    credential: admin.credential.cert(require(SERVICE_ACCOUNT_PATH)),
    storageBucket,
  });

  return admin;
}

function readSheet(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`Onglet introuvable : ${sheetName}`);

  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

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

function cleanString(value) {
  const text = String(value || "").trim();
  return text || undefined;
}

function cleanAmount(value) {
  if (value === "" || value === null || value === undefined) return undefined;

  const amount = Number(
    String(value).replace(",", ".").replace(/\s/g, "").trim()
  );

  return Number.isFinite(amount) ? amount : undefined;
}

function isCreditNoteRow(row) {
  const text = [
    row.number,
    row.clientExcel,
    row.fileName,
    row.designation,
  ]
    .join(" ")
    .toLowerCase();

  const amount = cleanAmount(row.amount);

  return text.includes("avoir") || (amount !== undefined && amount < 0);
}

function getPositiveAmount(value) {
  const amount = cleanAmount(value);

  if (amount === undefined) return undefined;

  return Math.abs(amount);
}

function excelDateToISO(value) {
  if (!value) return undefined;

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (
      !trimmed ||
      trimmed.toLowerCase() === "ok" ||
      trimmed.toLowerCase() === "annulé" ||
      trimmed.toLowerCase() === "annule" ||
      trimmed.toLowerCase() === "x"
    ) {
      return undefined;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }

    return undefined;
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return undefined;

    return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(
      parsed.d
    ).padStart(2, "0")}`;
  }

  return undefined;
}

function sanitizeFileName(value) {
  return String(value || "")
    .trim()
    .replace(/[^\w.-]+/g, "_")
    .replace(/_+/g, "_");
}

async function alreadyExists(db, type, number) {
  const snap = await db
    .collection(COLLECTION_NAME)
    .where("type", "==", type)
    .where("number", "==", number)
    .limit(1)
    .get();

  return !snap.empty;
}

async function uploadPdf(bucket, row) {
  const filePath = cleanString(row.filePath);
  const number = cleanString(row.number);

  if (!filePath) {
    throw new Error(`Chemin PDF vide pour ${number}`);
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`PDF introuvable : ${filePath}`);
  }

  const stats = fs.statSync(filePath);

  if (stats.size === 0) {
    throw new Error(`PDF vide : ${filePath}`);
  }

  const safeNumber = sanitizeFileName(number);
  const storagePath = `documents/archived-invoices/${safeNumber}.pdf`;

  if (IS_DRY_RUN) {
    return {
      pdfUrl: `DRY_RUN_URL/${storagePath}`,
      storagePath,
    };
  }

  await bucket.upload(filePath, {
    destination: storagePath,
    metadata: {
      contentType: "application/pdf",
    },
  });

  const file = bucket.file(storagePath);

  const [url] = await file.getSignedUrl({
    action: "read",
    expires: "03-01-2500",
  });

  return {
    pdfUrl: url,
    storagePath,
  };
}

function buildPayload(row, uploadResult) {
  const isCreditNote = isCreditNoteRow(row);
  return removeUndefined({
    type: isCreditNote ? "credit_note" : "invoice",
    number: cleanString(row.number) || "",

    clientId: undefined,
    clientName: cleanString(row.clientExcel) || "",
    historicalClientName: cleanString(row.clientExcel),
    clientMatchStatus: "recovered_missing_invoice",

    designation: cleanString(row.designation),

    documentDate: excelDateToISO(row.invoiceDate) || excelDateToISO(row.eventDate),
    invoiceDate: excelDateToISO(row.invoiceDate),
    eventDate: excelDateToISO(row.eventDate),

    amount: isCreditNote
      ? getPositiveAmount(row.amount)
      : cleanAmount(row.amount),

    reason: isCreditNote
      ? "Avoir historique importé"
      : undefined,

    currency: "USD",

    fileName: cleanString(row.fileName) || "",
    pdfUrl: uploadResult.pdfUrl,
    storagePath: uploadResult.storagePath,

    source: "historical_import",
    importBatch: "recovery_missing_invoices_v5",
    importStatus: "complete",
    auditVersion: "v5_recovery",

    metadataStatus:
      cleanString(row.designation) &&
        (excelDateToISO(row.invoiceDate) || excelDateToISO(row.eventDate))
        ? "complete"
        : "missing_info",

    isMetadataVerified: false,
    internalNote: "Récupéré automatiquement depuis missing_in_firestore",

    metadataUpdatedAt: null,
    metadataUpdatedBy: null,
    metadataVersion: 1,

    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    importedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

function removeUndefined(payload) {
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) delete payload[key];
  });

  return payload;
}

function appendWorksheet(workbook, data, sheetName) {
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(data.length ? data : [{ info: "Aucune donnée" }]),
    sheetName
  );
}

async function main() {
  console.log("===== RECOVERY MISSING INVOICES V5 =====");
  console.log("Dry run:", IS_DRY_RUN);

  if (!fs.existsSync(INPUT_PATH)) {
    throw new Error(`Fichier introuvable : ${INPUT_PATH}`);
  }

  const firebase = initFirebase();
  const db = firebase.firestore();

  const bucket = firebase
    .storage()
    .bucket(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET);

  const workbook = XLSX.readFile(INPUT_PATH);
  const rows = readSheet(workbook, "missing_in_firestore");

  console.log("Factures manquantes à traiter :", rows.length);

  const imported = [];
  const skipped = [];
  const failed = [];

  for (const row of rows) {
    const number = cleanString(row.number);
    const type = isCreditNoteRow(row)
      ? "credit_note"
      : "invoice";

    if (!number) {
      skipped.push({
        number,
        reason: "Numéro vide",
      });
      continue;
    }

    try {
      const exists = await alreadyExists(db, type, number);

      if (exists) {
        console.log(`⏭️ Déjà existante : ${number}`);

        skipped.push({
          number,
          clientExcel: row.clientExcel,
          fileName: row.fileName,
          reason: "Déjà existante dans Firestore",
        });

        continue;
      }

      console.log(`📄 Récupération facture : ${number} | ${row.clientExcel}`);

      const uploadResult = await uploadPdf(bucket, row);
      const payload = buildPayload(row, uploadResult);

      if (!IS_DRY_RUN) {
        const ref = await db.collection(COLLECTION_NAME).add(payload);

        imported.push({
          firestoreId: ref.id,
          number,
          clientExcel: row.clientExcel,
          fileName: row.fileName,
          filePath: row.filePath,
          amount: row.amount,
          invoiceDate: row.invoiceDate,
          eventDate: row.eventDate,
          storagePath: uploadResult.storagePath,
          status: "imported",
        });
      } else {
        imported.push({
          firestoreId: "DRY_RUN",
          number,
          clientExcel: row.clientExcel,
          fileName: row.fileName,
          filePath: row.filePath,
          amount: row.amount,
          invoiceDate: row.invoiceDate,
          eventDate: row.eventDate,
          storagePath: uploadResult.storagePath,
          status: "dry_run_ok",
        });
      }

      console.log(`✅ OK : ${number}`);
    } catch (error) {
      console.error(`❌ Erreur ${number}:`, error.message);

      failed.push({
        number,
        clientExcel: row.clientExcel,
        fileName: row.fileName,
        filePath: row.filePath,
        amount: row.amount,
        invoiceDate: row.invoiceDate,
        eventDate: row.eventDate,
        error: error.message,
      });
    }
  }

  const summary = [
    { indicateur: "Factures manquantes initiales", valeur: rows.length },
    { indicateur: "Importées", valeur: imported.length },
    { indicateur: "Ignorées", valeur: skipped.length },
    { indicateur: "En erreur", valeur: failed.length },
    {
      indicateur: "Mode",
      valeur: IS_DRY_RUN ? "dry-run" : "import réel",
    },
  ];

  const outputWorkbook = XLSX.utils.book_new();

  appendWorksheet(outputWorkbook, summary, "summary");
  appendWorksheet(outputWorkbook, imported, "imported");
  appendWorksheet(outputWorkbook, skipped, "skipped");
  appendWorksheet(outputWorkbook, failed, "failed");

  XLSX.writeFile(outputWorkbook, OUTPUT_PATH);

  console.log("===== RÉSUMÉ RECOVERY =====");
  console.table(summary);
  console.log("Rapport généré :", OUTPUT_PATH);
}

main().catch((error) => {
  console.error("Erreur fatale:", error);
  process.exit(1);
});