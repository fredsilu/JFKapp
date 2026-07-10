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

const SERVICE_ACCOUNT_PATH =
  path.resolve("serviceAccountKey.json");

const COLLECTION_NAME =
  "archived_documents";

const DIAGNOSTIC_SHEET =
  "07_ready_to_reimport";

const IS_COMMIT =
  process.argv.includes("--commit");

const IMPORT_BATCH =
  "missing_archives_recovery_v1";

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

function firstNonEmpty(object, fieldNames) {
  for (const fieldName of fieldNames) {
    const value = object?.[fieldName];

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

function readSheet(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new Error(
      `Feuille "${sheetName}" introuvable. Feuilles : ${workbook.SheetNames.join(", ")}`
    );
  }

  return XLSX.utils.sheet_to_json(sheet, {
    defval: "",
    raw: true,
  });
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

  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");

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

  const amount = Number(text);

  return Number.isFinite(amount)
    ? amount
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
    return normalizeDate(value.toDate());
  }

  if (
    value instanceof Date &&
    !Number.isNaN(value.getTime())
  ) {
    return value.toISOString().slice(0, 10);
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

  const text = cleanText(value);

  if (!text) {
    return undefined;
  }

  const frenchDate = text.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/
  );

  if (frenchDate) {
    return (
      `${frenchDate[3]}-` +
      `${String(frenchDate[2]).padStart(2, "0")}-` +
      `${String(frenchDate[1]).padStart(2, "0")}`
    );
  }

  const isoDate = text.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})/
  );

  if (isoDate) {
    return (
      `${isoDate[1]}-` +
      `${String(isoDate[2]).padStart(2, "0")}-` +
      `${String(isoDate[3]).padStart(2, "0")}`
    );
  }

  const parsed = new Date(text);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return text;
}

function removeUndefined(object) {
  return Object.fromEntries(
    Object.entries(object).filter(
      ([, value]) => value !== undefined
    )
  );
}

function sanitizeFileName(value) {
  return cleanText(value)
    .replace(/[^\w.-]+/g, "_")
    .replace(/_+/g, "_");
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
  let text = prepareDocumentText(value);

  text = text
    .replace(/^facture[\s_-]*/i, "")
    .replace(/[\s\-./\\]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  const match = text.match(
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
  let text = prepareDocumentText(value);

  text = text
    .replace(
      /^proforma[\s_-]*crepolia[\s_-]*/i,
      ""
    )
    .replace(/^proforma[\s_-]*/i, "")
    .replace(/[\s\-./\\]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  const pageMatch = text.match(
    /^cr(\d{4})_(\d+)_p(\d+)$/
  );

  if (pageMatch) {
    return (
      `cr${pageMatch[1]}_` +
      `${pageMatch[2].padStart(3, "0")}_p` +
      `${pageMatch[3].padStart(3, "0")}`
    );
  }

  const subNumberMatch = text.match(
    /^cr(\d{4})_(\d+)_(\d+)$/
  );

  if (subNumberMatch) {
    return (
      `cr${subNumberMatch[1]}_` +
      `${subNumberMatch[2].padStart(3, "0")}_` +
      `${subNumberMatch[3].padStart(3, "0")}`
    );
  }

  const standardMatch = text.match(
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
  return type === "invoice"
    ? normalizeInvoiceNumber(value)
    : normalizeProformaNumber(value);
}

/* ============================================================
   CONFIGURATION DES COLONNES SOURCE
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

    invoiceDateColumns: [
      "Date",
      "date",
      "Date facture",
      "dateFacture",
      "invoiceDate",
    ],

    eventDateColumns: [
      "Date événement",
      "Date evenement",
      "eventDate",
      "dateEvent",
    ],

    designationColumns: [
      "Designation",
      "Désignation",
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
      "eventDate",
      "dateEvent",
    ],

    designationColumns: [
      "Designation",
      "Désignation",
      "designation",
      "Objet",
      "objet",
    ],
  },
};

/* ============================================================
   CLIENTS ET MAPPING
============================================================ */

async function loadClients(db) {
  const snapshot = await db
    .collection("clients")
    .get();

  const index = new Map();

  for (const document of snapshot.docs) {
    const data = document.data();
    const name = cleanText(data.name);

    if (!name) {
      continue;
    }

    index.set(
      normalizeClientName(name),
      {
        id: document.id,
        name,
      }
    );
  }

  return index;
}

function loadClientMapping() {
  const mapping = new Map();

  if (!fs.existsSync(CLIENT_MAPPING_PATH)) {
    console.warn(
      "Mapping client absent, utilisation directe des noms Excel :",
      CLIENT_MAPPING_PATH
    );

    return mapping;
  }

  const workbook =
    XLSX.readFile(CLIENT_MAPPING_PATH);

  const sheetName =
    workbook.SheetNames.includes("client_mapping")
      ? "client_mapping"
      : workbook.SheetNames[0];

  const rows = readSheet(
    workbook,
    sheetName
  );

  for (const row of rows) {
    const finalClientName =
      cleanText(row.finalClientName);

    if (!finalClientName) {
      continue;
    }

    const aliases = [
      row.historicalGroupName,
      ...cleanText(row.aliases).split("|"),
    ];

    for (const alias of aliases) {
      const key =
        normalizeClientName(alias);

      if (key) {
        mapping.set(
          key,
          finalClientName
        );
      }
    }
  }

  return mapping;
}

function resolveClient(
  rawClientName,
  clientsByName,
  clientMapping
) {
  const historicalClientName =
    cleanText(rawClientName);

  const historicalKey =
    normalizeClientName(
      historicalClientName
    );

  const mappedName =
    clientMapping.get(
      historicalKey
    );

  if (mappedName) {
    const mappedClient =
      clientsByName.get(
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
        `Client mappé absent de la collection clients : ${mappedName}`,
    };
  }

  const directClient =
    clientsByName.get(
      historicalKey
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
   CHARGEMENT DES DONNÉES
============================================================ */

function loadSourceIndexes() {
  const workbook =
    XLSX.readFile(SOURCE_EXCEL_PATH, {
      cellDates: true,
    });

  const indexes = {
    invoice: new Map(),
    proforma: new Map(),
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

    rows.forEach((row, index) => {
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

      const sourceData = {
        excelRow:
          index + 2,

        rawNumber:
          cleanText(rawNumber),

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

        invoiceDate:
          type === "invoice"
            ? normalizeDate(
                firstNonEmpty(
                  row,
                  config.invoiceDateColumns
                )
              )
            : undefined,

        documentDate:
          type === "proforma"
            ? normalizeDate(
                firstNonEmpty(
                  row,
                  config.documentDateColumns
                )
              )
            : undefined,

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

        rawRow:
          row,
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
        .push(sourceData);
    });
  }

  return indexes;
}

function loadReadyDocuments() {
  if (!fs.existsSync(DIAGNOSTIC_PATH)) {
    throw new Error(
      `Diagnostic introuvable : ${DIAGNOSTIC_PATH}`
    );
  }

  const workbook =
    XLSX.readFile(DIAGNOSTIC_PATH);

  const rows =
    readSheet(
      workbook,
      DIAGNOSTIC_SHEET
    );

  return rows.filter(
    (row) =>
      cleanText(row.pretAReimporter)
        .toUpperCase() === "OUI" &&
      cleanText(row.pdfPresent)
        .toUpperCase() === "OUI" &&
      Number(row.numberOfValidPdf) === 1
  );
}

/* ============================================================
   CONTRÔLE FIRESTORE
============================================================ */

async function findExistingDocument(
  db,
  type,
  number
) {
  const exactSnapshot = await db
    .collection(COLLECTION_NAME)
    .where("type", "==", type)
    .where("number", "==", number)
    .limit(1)
    .get();

  if (!exactSnapshot.empty) {
    return {
      exists: true,
      reason: "EXACT_NUMBER",
      id: exactSnapshot.docs[0].id,
    };
  }

  const typeSnapshot = await db
    .collection(COLLECTION_NAME)
    .where("type", "==", type)
    .get();

  const expectedKey =
    normalizeDocumentNumber(
      number,
      type
    );

  for (const document of typeSnapshot.docs) {
    const data =
      document.data();

    const currentKey =
      normalizeDocumentNumber(
        data.number,
        type
      );

    if (
      currentKey &&
      currentKey === expectedKey
    ) {
      return {
        exists: true,
        reason: "NORMALIZED_NUMBER",
        id: document.id,
      };
    }
  }

  return {
    exists: false,
    reason: "",
    id: "",
  };
}

/* ============================================================
   STORAGE
============================================================ */

async function uploadPdf(
  bucket,
  type,
  number,
  pdfPath
) {
  if (!pdfPath) {
    throw new Error(
      `Chemin PDF absent pour ${number}`
    );
  }

  if (!fs.existsSync(pdfPath)) {
    throw new Error(
      `PDF introuvable pour ${number} : ${pdfPath}`
    );
  }

  const stats =
    fs.statSync(pdfPath);

  if (stats.size <= 0) {
    throw new Error(
      `PDF vide pour ${number} : ${pdfPath}`
    );
  }

  const folder =
    type === "invoice"
      ? "archived-invoices"
      : "archived-proformas";

  const storagePath =
    `documents/${folder}/` +
    `${sanitizeFileName(number)}.pdf`;

  if (!IS_COMMIT) {
    return {
      pdfUrl:
        `DRY_RUN_URL/${storagePath}`,

      storagePath,

      uploaded:
        false,
    };
  }

  await bucket.upload(
    pdfPath,
    {
      destination:
        storagePath,

      metadata: {
        contentType:
          "application/pdf",

        metadata: {
          originalFileName:
            path.basename(pdfPath),

          importBatch:
            IMPORT_BATCH,
        },
      },
    }
  );

  const file =
    bucket.file(storagePath);

  const [pdfUrl] =
    await file.getSignedUrl({
      action: "read",
      expires: "03-01-2500",
    });

  return {
    pdfUrl,
    storagePath,
    uploaded:
      true,
  };
}

/* ============================================================
   PAYLOAD
============================================================ */

function buildPayload({
  type,
  diagnosticRow,
  sourceRow,
  clientMatch,
  uploadResult,
  pdfPath,
}) {
  const number =
    cleanText(
      diagnosticRow.numeroExcel
    );

  const invoiceDate =
    type === "invoice"
      ? sourceRow.invoiceDate ||
        normalizeDate(
          diagnosticRow.dateExcel
        )
      : undefined;

  const proformaDate =
    type === "proforma"
      ? sourceRow.documentDate ||
        normalizeDate(
          diagnosticRow.dateExcel
        )
      : undefined;

  const eventDate =
    sourceRow.eventDate;

  const amount =
    sourceRow.amount ??
    normalizeAmount(
      diagnosticRow.montantExcel
    );

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

    documentDate:
      type === "invoice"
        ? invoiceDate || eventDate
        : proformaDate || eventDate,

    invoiceDate,

    eventDate,

    amount,

    currency:
      "USD",

    fileName:
      path.basename(pdfPath),

    originalFilePath:
      pdfPath,

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
      (
        invoiceDate ||
        proformaDate
      )
        ? "complete"
        : "missing_info",

    isMetadataVerified:
      false,

    internalNote:
      "Document récupéré depuis diagnostic_documents_manquants_v2.xlsx",

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
   PROGRAMME PRINCIPAL
============================================================ */

async function main() {
  console.log(
    "============================================"
  );
  console.log(
    "IMPORT DES ARCHIVES PRÊTES À RÉIMPORTER"
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
      SOURCE_EXCEL_PATH
    )
  ) {
    throw new Error(
      `Classeur source introuvable : ${SOURCE_EXCEL_PATH}`
    );
  }

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

  const readyDocuments =
    loadReadyDocuments();

  const sourceIndexes =
    loadSourceIndexes();

  const clientsByName =
    await loadClients(db);

  const clientMapping =
    loadClientMapping();

  console.log(
    "Documents validés dans le diagnostic :",
    readyDocuments.length
  );

  const results = [];

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (
    const diagnosticRow
    of readyDocuments
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

    const pdfPath =
      cleanText(
        diagnosticRow.pdfPaths
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

      if (
        pdfPath.includes(" | ")
      ) {
        throw new Error(
          "Plusieurs chemins PDF détectés dans une ligne censée être unique"
        );
      }

      const existing =
        await findExistingDocument(
          db,
          type,
          number
        );

      if (existing.exists) {
        skipped++;

        console.log(
          `⏭️ Déjà présent : ${type} ${number} (${existing.reason})`
        );

        results.push({
          type,
          number,
          status:
            "SKIPPED_ALREADY_EXISTS",
          firestoreId:
            existing.id,
          pdfPath,
          error:
            "",
        });

        continue;
      }

      const sourceCandidates =
        sourceIndexes[type].get(
          normalizedNumber
        ) ?? [];

      if (
        sourceCandidates.length === 0
      ) {
        throw new Error(
          `Ligne source introuvable dans ${SOURCE_CONFIG[type].sheet}`
        );
      }

      if (
        sourceCandidates.length > 1
      ) {
        throw new Error(
          `Plusieurs lignes source correspondent au numéro ${number}`
        );
      }

      const sourceRow =
        sourceCandidates[0];

      const rawClientName =
        sourceRow.clientName ||
        cleanText(
          diagnosticRow.clientExcel
        );

      const clientMatch =
        resolveClient(
          rawClientName,
          clientsByName,
          clientMapping
        );

      const uploadResult =
        await uploadPdf(
          bucket,
          type,
          number,
          pdfPath
        );

      const payload =
        buildPayload({
          type,
          diagnosticRow,
          sourceRow,
          clientMatch,
          uploadResult,
          pdfPath,
        });

      if (IS_COMMIT) {
        const reference =
          await db
            .collection(
              COLLECTION_NAME
            )
            .add(payload);

        imported++;

        console.log(
          `✅ Importé : ${type} ${number} — ${reference.id}`
        );

        results.push({
          type,
          number,
          status:
            "IMPORTED",
          firestoreId:
            reference.id,
          pdfPath,
          clientName:
            payload.clientName,
          amount:
            payload.amount,
          error:
            "",
        });
      } else {
        imported++;

        console.log(
          `🧪 DRY RUN : ${type} ${number} | ${payload.clientName} | ${pdfPath}`
        );

        results.push({
          type,
          number,
          status:
            "DRY_RUN_READY",
          firestoreId:
            "",
          pdfPath,
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
        status:
          "ERROR",
        firestoreId:
          "",
        pdfPath,
        error:
          error.message,
      });
    }
  }

  const reportPath =
    path.join(
      path.dirname(
        DIAGNOSTIC_PATH
      ),
      IS_COMMIT
        ? "import_ready_missing_archives_result.xlsx"
        : "import_ready_missing_archives_dry_run.xlsx"
    );

  const reportWorkbook =
    XLSX.utils.book_new();

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
        "Documents du diagnostic",
      valeur:
        readyDocuments.length,
    },
    {
      indicateur:
        IS_COMMIT
          ? "Documents importés"
          : "Documents prêts en simulation",
      valeur:
        imported,
    },
    {
      indicateur:
        "Documents ignorés car déjà présents",
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

  XLSX.utils.book_append_sheet(
    reportWorkbook,
    XLSX.utils.json_to_sheet(
      summary
    ),
    "summary"
  );

  XLSX.utils.book_append_sheet(
    reportWorkbook,
    XLSX.utils.json_to_sheet(
      results.length
        ? results
        : [
            {
              info:
                "Aucun résultat",
            },
          ]
    ),
    "details"
  );

  XLSX.writeFile(
    reportWorkbook,
    reportPath
  );

  console.log("");
  console.log(
    "============================================"
  );
  console.table(summary);

  console.log(
    "Rapport :",
    reportPath
  );

  if (!IS_COMMIT) {
    console.log("");
    console.log(
      "Aucune donnée n’a été écrite."
    );
    console.log(
      "Après validation du rapport, lance :"
    );
    console.log(
      "node scripts/import-ready-missing-archives.js --commit"
    );
  }
}

main().catch((error) => {
  console.error(
    "ERREUR FATALE :",
    error
  );

  console.error(
    error.stack ?? ""
  );

  process.exit(1);
});