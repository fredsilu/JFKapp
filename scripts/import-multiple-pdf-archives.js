require("dotenv").config({
  path: ".env.production",
});

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

/* ============================================================
   CONFIGURATION
============================================================ */

const DIAGNOSTIC_PATH =
  "B:/Professionnel/Creperie/Clientele/Archives_Crepolia/diagnostic_documents_manquants_v2.xlsx";

const SOURCE_EXCEL_PATH =
  "B:/Professionnel/Creperie/Clientele/Numero factures clients.xlsx";

const CLIENT_MAPPING_PATH =
  "B:/Professionnel/Creperie/Clientele/Archives_Crepolia/archive_client_mapping_v1.xlsx";

const OUTPUT_DIRECTORY =
  "B:/Professionnel/Creperie/Clientele/Archives_Crepolia";

const SERVICE_ACCOUNT_PATH =
  path.resolve("serviceAccountKey.json");

const COLLECTION_NAME =
  "archived_documents";

const DIAGNOSTIC_SHEET =
  "09_multiple_pdf";

const IMPORT_BATCH =
  "multiple_pdf_archives_recovery_v1";

const IS_COMMIT =
  process.argv.includes("--commit");

/* ============================================================
   CONFIGURATION DES FEUILLES SOURCE
============================================================ */

const SOURCE_CONFIG = {
  invoice: {
    sheet: "Factures",

    numberColumns: [
      "Factures",
      "Facture",
      "factures",
      "facture",
      "number",
      "Number",
      "numero",
      "Numéro",
      "invoiceNumber",
    ],

    clientColumns: [
      "Client",
      "client",
      "clientExcel",
      "clientName",
    ],

    amountColumns: [
      "Montant",
      "montant",
      "Amount",
      "amount",
      "Total",
      "total",
    ],

    documentDateColumns: [
      "Date",
      "date",
      "Date facture",
      "dateFacture",
      "invoiceDate",
    ],

    eventDateColumns: [
      "Date événement",
      "Date evenement",
      "date événement",
      "date evenement",
      "eventDate",
      "dateEvent",
    ],

    designationColumns: [
      "Désignation",
      "Designation",
      "designation",
      "Objet",
      "objet",
    ],
  },

  proforma: {
    sheet: "Proforma",

    numberColumns: [
      "Proforma",
      "Proformas",
      "proforma",
      "proformas",
      "number",
      "Number",
      "numero",
      "Numéro",
      "proformaNumber",
    ],

    clientColumns: [
      "Client",
      "client",
      "clientExcel",
      "clientName",
    ],

    amountColumns: [
      "Montant",
      "montant",
      "Amount",
      "amount",
      "Total",
      "total",
    ],

    documentDateColumns: [
      "Date",
      "date",
      "Date proforma",
      "dateProforma",
      "documentDate",
    ],

    eventDateColumns: [
      "Date événement",
      "Date evenement",
      "date événement",
      "date evenement",
      "eventDate",
      "dateEvent",
    ],

    designationColumns: [
      "Désignation",
      "Designation",
      "designation",
      "Objet",
      "objet",
    ],
  },
};

/* ============================================================
   FIREBASE
============================================================ */

function initFirebase() {
  if (admin.apps.length > 0) {
    return admin;
  }

  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    throw new Error(
      `serviceAccountKey.json introuvable : ${SERVICE_ACCOUNT_PATH}`
    );
  }

  const storageBucket =
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (!storageBucket) {
    throw new Error(
      "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET manquant dans .env.production"
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert(
      require(SERVICE_ACCOUNT_PATH)
    ),
    storageBucket,
  });

  return admin;
}

/* ============================================================
   UTILITAIRES
============================================================ */

function cleanText(value) {
  return String(value ?? "").trim();
}

function firstNonEmpty(
  object,
  fieldNames
) {
  for (const fieldName of fieldNames) {
    const value =
      object?.[fieldName];

    if (
      value !== undefined &&
      value !== null &&
      cleanText(value) !== ""
    ) {
      return value;
    }
  }

  return "";
}

function readSheet(
  workbook,
  sheetName
) {
  const sheet =
    workbook.Sheets[sheetName];

  if (!sheet) {
    throw new Error(
      `Feuille "${sheetName}" introuvable. Feuilles disponibles : ${workbook.SheetNames.join(", ")}`
    );
  }

  return XLSX.utils.sheet_to_json(
    sheet,
    {
      defval: "",
      raw: true,
    }
  );
}

function removeUndefined(object) {
  return Object.fromEntries(
    Object.entries(object).filter(
      ([, value]) =>
        value !== undefined
    )
  );
}

function sanitizeFileName(value) {
  return cleanText(value)
    .replace(/[^\w.-]+/g, "_")
    .replace(/_+/g, "_");
}

function normalizeClientName(value) {
  return cleanText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(
      /\b(sarl|sprl|sa|ltd|llc|inc|rdc|drc|kinshasa|kin)\b/g,
      ""
    )
    .replace(/[^a-z0-9]/g, "");
}

function normalizeAmount(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return undefined;
  }

  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : undefined;
  }

  let text = String(value)
    .trim()
    .replace(/\s/g, "")
    .replace(/[^\d,.-]/g, "");

  if (!text) {
    return undefined;
  }

  const lastComma =
    text.lastIndexOf(",");

  const lastDot =
    text.lastIndexOf(".");

  if (
    lastComma !== -1 &&
    lastDot !== -1
  ) {
    if (lastComma > lastDot) {
      text = text
        .replace(/\./g, "")
        .replace(",", ".");
    } else {
      text = text.replace(/,/g, "");
    }
  } else if (lastComma !== -1) {
    text = text.replace(",", ".");
  }

  const result =
    Number(text);

  return Number.isFinite(result)
    ? result
    : undefined;
}

function normalizeDate(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return undefined;
  }

  if (
    value &&
    typeof value.toDate === "function"
  ) {
    return normalizeDate(
      value.toDate()
    );
  }

  if (
    value instanceof Date &&
    !Number.isNaN(value.getTime())
  ) {
    return value
      .toISOString()
      .slice(0, 10);
  }

  if (typeof value === "number") {
    const parsed =
      XLSX.SSF.parse_date_code(value);

    if (!parsed) {
      return undefined;
    }

    return (
      `${parsed.y}-` +
      `${String(parsed.m).padStart(2, "0")}-` +
      `${String(parsed.d).padStart(2, "0")}`
    );
  }

  const text =
    cleanText(value);

  const frenchDate =
    text.match(
      /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/
    );

  if (frenchDate) {
    return (
      `${frenchDate[3]}-` +
      `${String(frenchDate[2]).padStart(2, "0")}-` +
      `${String(frenchDate[1]).padStart(2, "0")}`
    );
  }

  const isoDate =
    text.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})/
    );

  if (isoDate) {
    return (
      `${isoDate[1]}-` +
      `${String(isoDate[2]).padStart(2, "0")}-` +
      `${String(isoDate[3]).padStart(2, "0")}`
    );
  }

  const parsed =
    new Date(text);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed
      .toISOString()
      .slice(0, 10);
  }

  return text || undefined;
}

/* ============================================================
   NORMALISATION DES NUMÉROS
============================================================ */

function prepareDocumentText(value) {
  return cleanText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\.(pdf|xlsx|xls)$/i, "");
}

function normalizeInvoiceNumber(value) {
  let text =
    prepareDocumentText(value);

  text = text
    .replace(/^facture[\s_-]*/i, "")
    .replace(/[\s\-./\\]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  const match =
    text.match(
      /^cr(\d{4})_fc_(\d+)([a-z]*)$/
    );

  if (!match) {
    return text
      ? `facture_${text}`
      : "";
  }

  return (
    `facture_cr${match[1]}_fc_` +
    `${match[2].padStart(3, "0")}` +
    `${match[3] ?? ""}`
  );
}

function normalizeProformaNumber(value) {
  let text =
    prepareDocumentText(value);

  text = text
    .replace(
      /^proforma[\s_-]*crepolia[\s_-]*/i,
      ""
    )
    .replace(
      /^proforma[\s_-]*/i,
      ""
    )
    .replace(/[\s\-./\\]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  const pageMatch =
    text.match(
      /^cr(\d{4})_(\d+)_p(\d+)$/
    );

  if (pageMatch) {
    return (
      `cr${pageMatch[1]}_` +
      `${pageMatch[2].padStart(3, "0")}_p` +
      `${pageMatch[3].padStart(3, "0")}`
    );
  }

  const subMatch =
    text.match(
      /^cr(\d{4})_(\d+)_(\d+)$/
    );

  if (subMatch) {
    return (
      `cr${subMatch[1]}_` +
      `${subMatch[2].padStart(3, "0")}_` +
      `${subMatch[3].padStart(3, "0")}`
    );
  }

  const standardMatch =
    text.match(
      /^cr(\d{4})_(\d+)([a-z]*)$/
    );

  if (standardMatch) {
    return (
      `cr${standardMatch[1]}_` +
      `${standardMatch[2].padStart(3, "0")}` +
      `${standardMatch[3] ?? ""}`
    );
  }

  return text;
}

function normalizeDocumentNumber(
  value,
  type
) {
  if (type === "invoice") {
    return normalizeInvoiceNumber(value);
  }

  if (type === "proforma") {
    return normalizeProformaNumber(value);
  }

  return "";
}

/* ============================================================
   CHARGEMENT DU MAPPING CLIENT
============================================================ */

async function loadClients(db) {
  const snapshot = await db
    .collection("clients")
    .get();

  const clients =
    new Map();

  for (const document of snapshot.docs) {
    const data =
      document.data();

    const name =
      cleanText(data.name);

    if (!name) {
      continue;
    }

    clients.set(
      normalizeClientName(name),
      {
        id:
          document.id,

        name,
      }
    );
  }

  return clients;
}

function loadClientMapping() {
  const mapping =
    new Map();

  if (
    !fs.existsSync(
      CLIENT_MAPPING_PATH
    )
  ) {
    console.warn(
      "Mapping client introuvable :",
      CLIENT_MAPPING_PATH
    );

    return mapping;
  }

  const workbook =
    XLSX.readFile(
      CLIENT_MAPPING_PATH
    );

  const sheetName =
    workbook.SheetNames.includes(
      "client_mapping"
    )
      ? "client_mapping"
      : workbook.SheetNames[0];

  const rows =
    readSheet(
      workbook,
      sheetName
    );

  for (const row of rows) {
    const finalName =
      cleanText(
        row.finalClientName
      );

    if (!finalName) {
      continue;
    }

    const aliases = [
      row.historicalGroupName,
      ...cleanText(
        row.aliases
      ).split("|"),
    ];

    for (const alias of aliases) {
      const key =
        normalizeClientName(alias);

      if (key) {
        mapping.set(
          key,
          finalName
        );
      }
    }
  }

  return mapping;
}

function resolveClient(
  rawClient,
  clients,
  clientMapping
) {
  const historicalClientName =
    cleanText(rawClient);

  const clientKey =
    normalizeClientName(
      historicalClientName
    );

  const mappedName =
    clientMapping.get(
      clientKey
    );

  if (mappedName) {
    const mappedClient =
      clients.get(
        normalizeClientName(
          mappedName
        )
      );

    if (mappedClient) {
      return {
        clientId:
          mappedClient.id,

        clientName:
          mappedClient.name,

        historicalClientName,

        clientMatchStatus:
          "mapped",

        clientMatchReason:
          `${historicalClientName} -> ${mappedClient.name}`,
      };
    }

    return {
      clientId:
        undefined,

      clientName:
        mappedName,

      historicalClientName,

      clientMatchStatus:
        "new_historical_client",

      clientMatchReason:
        `Client mappé absent de Firestore : ${mappedName}`,
    };
  }

  const directClient =
    clients.get(
      clientKey
    );

  if (directClient) {
    return {
      clientId:
        directClient.id,

      clientName:
        directClient.name,

      historicalClientName,

      clientMatchStatus:
        "direct",

      clientMatchReason:
        "Correspondance directe",
    };
  }

  return {
    clientId:
      undefined,

    clientName:
      historicalClientName,

    historicalClientName,

    clientMatchStatus:
      "unmapped",

    clientMatchReason:
      "Aucune correspondance client",
  };
}

/* ============================================================
   CHARGEMENT DES LIGNES SOURCE
============================================================ */

function loadSourceIndexes() {
  const workbook =
    XLSX.readFile(
      SOURCE_EXCEL_PATH,
      {
        cellDates: true,
      }
    );

  const indexes = {
    invoice:
      new Map(),

    proforma:
      new Map(),
  };

  for (
    const type
    of ["invoice", "proforma"]
  ) {
    const config =
      SOURCE_CONFIG[type];

    const rows =
      readSheet(
        workbook,
        config.sheet
      );

    rows.forEach(
      (row, index) => {
        const rawNumber =
          firstNonEmpty(
            row,
            config.numberColumns
          );

        const normalizedNumber =
          normalizeDocumentNumber(
            rawNumber,
            type
          );

        if (!normalizedNumber) {
          return;
        }

        const sourceRow = {
          excelRow:
            index + 2,

          number:
            cleanText(
              rawNumber
            ),

          clientName:
            cleanText(
              firstNonEmpty(
                row,
                config.clientColumns
              )
            ),

          amount:
            normalizeAmount(
              firstNonEmpty(
                row,
                config.amountColumns
              )
            ),

          documentDate:
            normalizeDate(
              firstNonEmpty(
                row,
                config.documentDateColumns
              )
            ),

          eventDate:
            normalizeDate(
              firstNonEmpty(
                row,
                config.eventDateColumns
              )
            ),

          designation:
            cleanText(
              firstNonEmpty(
                row,
                config.designationColumns
              )
            ),
        };

        if (
          !indexes[type].has(
            normalizedNumber
          )
        ) {
          indexes[type].set(
            normalizedNumber,
            []
          );
        }

        indexes[type]
          .get(normalizedNumber)
          .push(sourceRow);
      }
    );
  }

  return indexes;
}

/* ============================================================
   SÉLECTION DU PDF LE PLUS RÉCENT
============================================================ */

function splitPdfPaths(value) {
  return cleanText(value)
    .split(/\s*\|\s*/)
    .map(
      (item) =>
        cleanText(item)
    )
    .filter(Boolean);
}

function inspectPdf(pdfPath) {
  if (!fs.existsSync(pdfPath)) {
    return {
      path:
        pdfPath,

      exists:
        false,

      valid:
        false,

      size:
        0,

      modifiedAt:
        "",

      modifiedAtMs:
        0,

      error:
        "FICHIER_INTROUVABLE",
    };
  }

  try {
    const stats =
      fs.statSync(pdfPath);

    return {
      path:
        pdfPath,

      exists:
        true,

      valid:
        stats.isFile() &&
        stats.size > 0,

      size:
        stats.size,

      modifiedAt:
        stats.mtime.toISOString(),

      modifiedAtMs:
        stats.mtimeMs,

      error:
        stats.size > 0
          ? ""
          : "FICHIER_VIDE",
    };
  } catch (error) {
    return {
      path:
        pdfPath,

      exists:
        true,

      valid:
        false,

      size:
        0,

      modifiedAt:
        "",

      modifiedAtMs:
        0,

      error:
        error.message,
    };
  }
}

function selectMostRecentPdf(
  pdfPaths
) {
  const candidates =
    pdfPaths.map(
      inspectPdf
    );

  const validCandidates =
    candidates
      .filter(
        (candidate) =>
          candidate.valid
      )
      .sort(
        (a, b) => {
          if (
            b.modifiedAtMs !==
            a.modifiedAtMs
          ) {
            return (
              b.modifiedAtMs -
              a.modifiedAtMs
            );
          }

          if (
            b.size !==
            a.size
          ) {
            return (
              b.size -
              a.size
            );
          }

          return a.path.localeCompare(
            b.path
          );
        }
      );

  return {
    candidates,

    validCandidates,

    selected:
      validCandidates[0] ??
      null,
  };
}

/* ============================================================
   CONTRÔLE FIRESTORE
============================================================ */

async function buildExistingIndex(
  db
) {
  const snapshot = await db
    .collection(
      COLLECTION_NAME
    )
    .get();

  const index =
    new Map();

  for (
    const document
    of snapshot.docs
  ) {
    const data =
      document.data();

    const type =
      cleanText(
        data.type
      );

    if (
      type !== "invoice" &&
      type !== "proforma"
    ) {
      continue;
    }

    const normalizedNumber =
      normalizeDocumentNumber(
        data.number,
        type
      );

    if (!normalizedNumber) {
      continue;
    }

    index.set(
      `${type}::${normalizedNumber}`,
      {
        id:
          document.id,

        number:
          data.number,

        type,
      }
    );
  }

  return index;
}

/* ============================================================
   STORAGE
============================================================ */

async function uploadPdf({
  bucket,
  type,
  number,
  selectedPdf,
}) {
  const folder =
    type === "invoice"
      ? "archived-invoices"
      : "archived-proformas";

  const storagePath =
    `documents/${folder}/` +
    `${sanitizeFileName(number)}.pdf`;

  if (!IS_COMMIT) {
    return {
      storagePath,

      pdfUrl:
        `DRY_RUN_URL/${storagePath}`,
    };
  }

  await bucket.upload(
    selectedPdf.path,
    {
      destination:
        storagePath,

      metadata: {
        contentType:
          "application/pdf",

        metadata: {
          originalFileName:
            path.basename(
              selectedPdf.path
            ),

          originalModifiedAt:
            selectedPdf.modifiedAt,

          selectionRule:
            "MOST_RECENT_MTIME",

          importBatch:
            IMPORT_BATCH,
        },
      },
    }
  );

  const file =
    bucket.file(
      storagePath
    );

  const [pdfUrl] =
    await file.getSignedUrl({
      action:
        "read",

      expires:
        "03-01-2500",
    });

  return {
    storagePath,
    pdfUrl,
  };
}

/* ============================================================
   PAYLOAD FIRESTORE
============================================================ */

function buildPayload({
  type,
  number,
  diagnosticRow,
  sourceRow,
  selectedPdf,
  clientMatch,
  uploadResult,
  candidateCount,
}) {
  const documentDate =
    sourceRow.documentDate ||
    normalizeDate(
      diagnosticRow.dateExcel
    ) ||
    sourceRow.eventDate;

  return removeUndefined({
    type,

    number,

    clientId:
      clientMatch.clientId,

    clientName:
      clientMatch.clientName,

    historicalClientName:
      clientMatch.historicalClientName,

    clientMatchStatus:
      clientMatch.clientMatchStatus,

    clientMatchReason:
      clientMatch.clientMatchReason,

    designation:
      sourceRow.designation ||
      undefined,

    documentDate,

    invoiceDate:
      type === "invoice"
        ? documentDate
        : undefined,

    eventDate:
      sourceRow.eventDate,

    amount:
      sourceRow.amount ??
      normalizeAmount(
        diagnosticRow.montantExcel
      ),

    currency:
      "USD",

    fileName:
      path.basename(
        selectedPdf.path
      ),

    originalFilePath:
      selectedPdf.path,

    originalFileModifiedAt:
      selectedPdf.modifiedAt,

    originalFileSize:
      selectedPdf.size,

    pdfCandidateCount:
      candidateCount,

    pdfSelectionRule:
      "MOST_RECENT_MTIME_THEN_LARGEST_SIZE",

    pdfUrl:
      uploadResult.pdfUrl,

    storagePath:
      uploadResult.storagePath,

    source:
      "historical_recovery",

    importBatch:
      IMPORT_BATCH,

    importStatus:
      "complete",

    auditVersion:
      "diagnostic_v2",

    recoverySourceSheet:
      DIAGNOSTIC_SHEET,

    recoveryExcelRow:
      diagnosticRow.ligneExcel,

    normalizedNumber:
      diagnosticRow.numeroNormalise,

    metadataStatus:
      sourceRow.designation &&
      documentDate
        ? "complete"
        : "missing_info",

    isMetadataVerified:
      false,

    internalNote:
      "Document récupéré depuis 09_multiple_pdf ; PDF le plus récent sélectionné automatiquement.",

    metadataVersion:
      1,

    createdAt:
      admin.firestore.FieldValue.serverTimestamp(),

    updatedAt:
      admin.firestore.FieldValue.serverTimestamp(),

    importedAt:
      admin.firestore.FieldValue.serverTimestamp(),
  });
}

/* ============================================================
   RAPPORT EXCEL
============================================================ */

function appendWorksheet(
  workbook,
  rows,
  sheetName
) {
  const safeRows =
    rows.length > 0
      ? rows
      : [
          {
            info:
              "Aucune donnée",
          },
        ];

  const worksheet =
    XLSX.utils.json_to_sheet(
      safeRows
    );

  const headers =
    Object.keys(
      safeRows[0]
    );

  worksheet["!autofilter"] = {
    ref:
      `A1:` +
      `${XLSX.utils.encode_col(
        headers.length - 1
      )}` +
      `${safeRows.length + 1}`,
  };

  worksheet["!cols"] =
    headers.map(
      (header) => ({
        wch:
          Math.min(
            Math.max(
              header.length + 2,
              14
            ),
            60
          ),
      })
    );

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    sheetName.substring(
      0,
      31
    )
  );
}

/* ============================================================
   PROGRAMME PRINCIPAL
============================================================ */

async function main() {
  console.log(
    "============================================"
  );

  console.log(
    "IMPORT DES ARCHIVES AVEC PLUSIEURS PDF"
  );

  console.log(
    "============================================"
  );

  console.log(
    "Mode :",
    IS_COMMIT
      ? "COMMIT — ÉCRITURE ACTIVE"
      : "DRY RUN — AUCUNE ÉCRITURE"
  );

  if (
    !fs.existsSync(
      DIAGNOSTIC_PATH
    )
  ) {
    throw new Error(
      `Diagnostic introuvable : ${DIAGNOSTIC_PATH}`
    );
  }

  if (
    !fs.existsSync(
      SOURCE_EXCEL_PATH
    )
  ) {
    throw new Error(
      `Classeur source introuvable : ${SOURCE_EXCEL_PATH}`
    );
  }

  if (
    !fs.existsSync(
      OUTPUT_DIRECTORY
    )
  ) {
    fs.mkdirSync(
      OUTPUT_DIRECTORY,
      {
        recursive:
          true,
      }
    );
  }

  const diagnosticWorkbook =
    XLSX.readFile(
      DIAGNOSTIC_PATH
    );

  const diagnosticRows =
    readSheet(
      diagnosticWorkbook,
      DIAGNOSTIC_SHEET
    );

  console.log(
    "Documents avec plusieurs PDF :",
    diagnosticRows.length
  );

  const sourceIndexes =
    loadSourceIndexes();

  const firebase =
    initFirebase();

  const db =
    firebase.firestore();

  const bucket =
    firebase
      .storage()
      .bucket(
        process.env
          .EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
      );

  const clients =
    await loadClients(db);

  const clientMapping =
    loadClientMapping();

  const existingIndex =
    await buildExistingIndex(
      db
    );

  const results = [];
  const candidateDetails = [];

  let imported = 0;
  let ready = 0;
  let skipped = 0;
  let errors = 0;

  for (
    const diagnosticRow
    of diagnosticRows
  ) {
    const type =
      cleanText(
        diagnosticRow.typeAttendu
      );

    const number =
      cleanText(
        diagnosticRow.numeroExcel
      );

    const normalizedNumber =
      normalizeDocumentNumber(
        number,
        type
      );

    try {
      if (
        type !== "invoice" &&
        type !== "proforma"
      ) {
        throw new Error(
          `Type non supporté : ${type}`
        );
      }

      if (!number) {
        throw new Error(
          "Numéro absent"
        );
      }

      const existingKey =
        `${type}::${normalizedNumber}`;

      const existing =
        existingIndex.get(
          existingKey
        );

      if (existing) {
        skipped++;

        console.log(
          `⏭️ Déjà présent : ${type} ${number}`
        );

        results.push({
          type,
          number,
          normalizedNumber,
          status:
            "SKIPPED_ALREADY_EXISTS",
          firestoreId:
            existing.id,
          selectedPdf:
            "",
          error:
            "",
        });

        continue;
      }

      const pdfPaths =
        splitPdfPaths(
          diagnosticRow.pdfPaths
        );

      if (
        pdfPaths.length < 2
      ) {
        throw new Error(
          `Moins de deux chemins PDF détectés : ${pdfPaths.length}`
        );
      }

      const selection =
        selectMostRecentPdf(
          pdfPaths
        );

      for (
        const candidate
        of selection.candidates
      ) {
        candidateDetails.push({
          type,
          number,
          normalizedNumber,

          selected:
            selection.selected &&
            candidate.path ===
              selection.selected.path
              ? "OUI"
              : "NON",

          pdfPath:
            candidate.path,

          exists:
            candidate.exists
              ? "OUI"
              : "NON",

          valid:
            candidate.valid
              ? "OUI"
              : "NON",

          size:
            candidate.size,

          modifiedAt:
            candidate.modifiedAt,

          error:
            candidate.error,
        });
      }

      if (!selection.selected) {
        throw new Error(
          "Aucun PDF valide parmi les candidats"
        );
      }

      const sourceCandidates =
        sourceIndexes[type].get(
          normalizedNumber
        ) ?? [];

      if (
        sourceCandidates.length === 0
      ) {
        throw new Error(
          `Ligne source introuvable dans la feuille ${SOURCE_CONFIG[type].sheet}`
        );
      }

      if (
        sourceCandidates.length > 1
      ) {
        throw new Error(
          `Plusieurs lignes Excel correspondent à ${number}`
        );
      }

      const sourceRow =
        sourceCandidates[0];

      const rawClient =
        sourceRow.clientName ||
        cleanText(
          diagnosticRow.clientExcel
        );

      const clientMatch =
        resolveClient(
          rawClient,
          clients,
          clientMapping
        );

      const uploadResult =
        await uploadPdf({
          bucket,
          type,
          number,
          selectedPdf:
            selection.selected,
        });

      const payload =
        buildPayload({
          type,
          number,
          diagnosticRow,
          sourceRow,
          selectedPdf:
            selection.selected,
          clientMatch,
          uploadResult,
          candidateCount:
            selection.candidates.length,
        });

      if (IS_COMMIT) {
        const reference =
          await db
            .collection(
              COLLECTION_NAME
            )
            .add(payload);

        existingIndex.set(
          existingKey,
          {
            id:
              reference.id,

            number,

            type,
          }
        );

        imported++;

        console.log(
          `✅ Importé : ${type} ${number}`
        );

        console.log(
          `   PDF retenu : ${selection.selected.path}`
        );

        results.push({
          type,
          number,
          normalizedNumber,

          status:
            "IMPORTED",

          firestoreId:
            reference.id,

          candidates:
            selection.candidates.length,

          selectedPdf:
            selection.selected.path,

          selectedModifiedAt:
            selection.selected.modifiedAt,

          selectedSize:
            selection.selected.size,

          clientName:
            payload.clientName,

          amount:
            payload.amount,

          storagePath:
            payload.storagePath,

          error:
            "",
        });
      } else {
        ready++;

        console.log(
          `🧪 DRY RUN : ${type} ${number}`
        );

        console.log(
          `   PDF retenu : ${selection.selected.path}`
        );

        console.log(
          `   Modifié le : ${selection.selected.modifiedAt}`
        );

        results.push({
          type,
          number,
          normalizedNumber,

          status:
            "DRY_RUN_READY",

          firestoreId:
            "",

          candidates:
            selection.candidates.length,

          validCandidates:
            selection.validCandidates.length,

          selectedPdf:
            selection.selected.path,

          selectedModifiedAt:
            selection.selected.modifiedAt,

          selectedSize:
            selection.selected.size,

          clientName:
            payload.clientName,

          amount:
            payload.amount,

          storagePath:
            payload.storagePath,

          error:
            "",
        });
      }
    } catch (error) {
      errors++;

      console.error(
        `❌ Erreur ${type} ${number}:`,
        error.message
      );

      results.push({
        type,
        number,
        normalizedNumber,

        status:
          "ERROR",

        firestoreId:
          "",

        candidates:
          "",

        selectedPdf:
          "",

        error:
          error.message,
      });
    }
  }

  const reportPath =
    path.join(
      OUTPUT_DIRECTORY,
      IS_COMMIT
        ? "import_multiple_pdf_archives_result.xlsx"
        : "import_multiple_pdf_archives_dry_run.xlsx"
    );

  const summary = [
    {
      indicateur:
        "Mode",

      valeur:
        IS_COMMIT
          ? "COMMIT"
          : "DRY_RUN",
    },

    {
      indicateur:
        "Documents dans 09_multiple_pdf",

      valeur:
        diagnosticRows.length,
    },

    {
      indicateur:
        IS_COMMIT
          ? "Documents importés"
          : "Documents prêts en simulation",

      valeur:
        IS_COMMIT
          ? imported
          : ready,
    },

    {
      indicateur:
        "Documents déjà présents et ignorés",

      valeur:
        skipped,
    },

    {
      indicateur:
        "Erreurs",

      valeur:
        errors,
    },
  ];

  const reportWorkbook =
    XLSX.utils.book_new();

  appendWorksheet(
    reportWorkbook,
    summary,
    "01_summary"
  );

  appendWorksheet(
    reportWorkbook,
    results,
    "02_results"
  );

  appendWorksheet(
    reportWorkbook,
    candidateDetails,
    "03_pdf_candidates"
  );

  XLSX.writeFile(
    reportWorkbook,
    reportPath
  );

  console.log("");
  console.log(
    "============================================"
  );

  console.table(
    summary
  );

  console.log(
    "Rapport :",
    reportPath
  );

  if (!IS_COMMIT) {
    console.log("");
    console.log(
      "Aucune écriture n’a été effectuée."
    );

    console.log(
      "Vérifie surtout la feuille 03_pdf_candidates."
    );

    console.log(
      "Le PDF retenu porte selected = OUI."
    );

    console.log("");
    console.log(
      "Pour effectuer l’import réel :"
    );

    console.log(
      "node scripts/import-multiple-pdf-archives.js --commit"
    );
  }
}

main().catch(
  (error) => {
    console.error(
      "ERREUR FATALE :",
      error
    );

    console.error(
      error.stack ?? ""
    );

    process.exit(1);
  }
);