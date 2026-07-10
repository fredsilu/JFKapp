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

const EXCEL_PATH =
  "B:/Professionnel/Creperie/Clientele/Numero factures clients.xlsx";

const OUTPUT_PATH =
  "B:/Professionnel/Creperie/Clientele/Archives_Crepolia/audit_factures_proformas_vs_firestore.xlsx";

const SERVICE_ACCOUNT_PATH = path.resolve(
  "serviceAccountKey.json"
);

const COLLECTION_NAME = "archived_documents";

const DOCUMENT_CONFIGS = [
  {
    label: "Factures",
    excelSheet: "Factures",
    firestoreType: "invoice",

    numberColumns: [
      "Factures",
      "factures",
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
  },

  {
    label: "Proformas",
    excelSheet: "Proforma",
    firestoreType: "proforma",

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
  },
];

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

  admin.initializeApp({
    credential: admin.credential.cert(
      require(SERVICE_ACCOUNT_PATH)
    ),
  });

  return admin;
}

/* ============================================================
   NORMALISATION
============================================================ */

/**
 * Exemples :
 *
 * facture_CR2026_FC_49
 * facture_CR2026-FC-049.pdf
 *
 * deviennent :
 *
 * facture_cr2026_fc_049
 *
 * Les suffixes sont aussi conservés :
 *
 * FC_38b -> FC_038b
 */
function normalizeDocumentNumber(value) {
  let normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\.(pdf|xlsx|xls)$/i, "")
    .replace(/[\s\-./\\]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  normalized = normalized.replace(
    /(\d+)([a-z]*)$/,
    (_, numericPart, suffix) => {
      return `${numericPart.padStart(3, "0")}${suffix}`;
    }
  );

  return normalized;
}

function firstNonEmpty(object, fieldNames) {
  for (const fieldName of fieldNames) {
    const value = object?.[fieldName];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return "";
}

/* ============================================================
   OUTILS
============================================================ */

function addToMap(map, key, value) {
  if (!key) return;

  if (!map.has(key)) {
    map.set(key, []);
  }

  map.get(key).push(value);
}

function appendWorksheet(
  workbook,
  data,
  sheetName
) {
  const safeData =
    data.length > 0
      ? data
      : [{ info: "Aucune donnée" }];

  const worksheet =
    XLSX.utils.json_to_sheet(safeData);

  const headers = Object.keys(safeData[0]);

  worksheet["!autofilter"] = {
    ref:
      `A1:` +
      `${XLSX.utils.encode_col(headers.length - 1)}` +
      `${safeData.length + 1}`,
  };

  worksheet["!cols"] = headers.map(
    (header) => ({
      wch: Math.min(
        Math.max(
          String(header).length + 2,
          14
        ),
        45
      ),
    })
  );

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    sheetName.substring(0, 31)
  );
}

/* ============================================================
   LECTURE EXCEL
============================================================ */

function readExcelDocuments(
  workbook,
  config
) {
  const worksheet =
    workbook.Sheets[config.excelSheet];

  if (!worksheet) {
    throw new Error(
      `Feuille "${config.excelSheet}" introuvable. ` +
      `Feuilles disponibles : ${workbook.SheetNames.join(", ")}`
    );
  }

  const rawRows =
    XLSX.utils.sheet_to_json(
      worksheet,
      {
        defval: "",
        raw: false,
      }
    );

  const documents = rawRows
    .map((row, index) => {
      const rawNumber =
        firstNonEmpty(
          row,
          config.numberColumns
        );

      const client =
        firstNonEmpty(
          row,
          config.clientColumns
        );

      return {
        excelRow: index + 2,
        documentType:
          config.firestoreType,
        numberExcel:
          rawNumber,
        normalizedNumber:
          normalizeDocumentNumber(rawNumber),
        clientExcel:
          client,
      };
    })
    .filter(
      (row) => row.normalizedNumber
    );

  return {
    rawCount: rawRows.length,
    documents,
  };
}

/* ============================================================
   AUDIT D’UN TYPE DE DOCUMENT
============================================================ */

function auditDocumentType({
  excelDocuments,
  firestoreDocuments,
  label,
}) {
  const excelByNumber = new Map();
  const firestoreByNumber = new Map();

  for (const row of excelDocuments) {
    addToMap(
      excelByNumber,
      row.normalizedNumber,
      row
    );
  }

  for (const doc of firestoreDocuments) {
    addToMap(
      firestoreByNumber,
      doc.normalizedNumber,
      doc
    );
  }

  const presentInBoth = [];

  for (const excelRow of excelDocuments) {
    const matches =
      firestoreByNumber.get(
        excelRow.normalizedNumber
      ) ?? [];

    for (const firestoreDoc of matches) {
      presentInBoth.push({
        typeDocument: label,

        excelRow:
          excelRow.excelRow,

        numberExcel:
          excelRow.numberExcel,

        numberFirestore:
          firestoreDoc.numberFirestore,

        normalizedNumber:
          excelRow.normalizedNumber,

        clientExcel:
          excelRow.clientExcel,

        clientFirestore:
          firestoreDoc.clientFirestore,

        firestoreId:
          firestoreDoc.firestoreId,

        firestoreType:
          firestoreDoc.firestoreType,

        fileNameFirestore:
          firestoreDoc.fileName,

        importBatch:
          firestoreDoc.importBatch,

        status:
          "PRÉSENT_DANS_EXCEL_ET_FIRESTORE",
      });
    }
  }

  const missingInFirestore =
    excelDocuments
      .filter(
        (row) =>
          !firestoreByNumber.has(
            row.normalizedNumber
          )
      )
      .map((row) => ({
        typeDocument: label,

        excelRow:
          row.excelRow,

        numberExcel:
          row.numberExcel,

        normalizedNumber:
          row.normalizedNumber,

        clientExcel:
          row.clientExcel,

        status:
          "ABSENT_DE_FIRESTORE",
      }));

  const extraInFirestore =
    firestoreDocuments
      .filter(
        (doc) =>
          !excelByNumber.has(
            doc.normalizedNumber
          )
      )
      .map((doc) => ({
        typeDocument: label,

        firestoreId:
          doc.firestoreId,

        numberFirestore:
          doc.numberFirestore,

        normalizedNumber:
          doc.normalizedNumber,

        clientFirestore:
          doc.clientFirestore,

        firestoreType:
          doc.firestoreType,

        fileNameFirestore:
          doc.fileName,

        importBatch:
          doc.importBatch,

        status:
          "ABSENT_DE_LA_FEUILLE_EXCEL",
      }));

  const duplicateExcel = [];

  for (
    const [normalizedNumber, rows]
    of excelByNumber.entries()
  ) {
    if (rows.length <= 1) continue;

    duplicateExcel.push({
      typeDocument: label,

      normalizedNumber,

      occurrences:
        rows.length,

      excelRows:
        rows
          .map((row) => row.excelRow)
          .join(", "),

      numbers:
        rows
          .map((row) => row.numberExcel)
          .join(" | "),

      clients:
        rows
          .map((row) => row.clientExcel)
          .join(" | "),
    });
  }

  const duplicateFirestore = [];

  for (
    const [normalizedNumber, docs]
    of firestoreByNumber.entries()
  ) {
    if (docs.length <= 1) continue;

    duplicateFirestore.push({
      typeDocument: label,

      normalizedNumber,

      occurrences:
        docs.length,

      firestoreIds:
        docs
          .map((doc) => doc.firestoreId)
          .join(" | "),

      numbers:
        docs
          .map((doc) => doc.numberFirestore)
          .join(" | "),

      clients:
        docs
          .map((doc) => doc.clientFirestore)
          .join(" | "),
    });
  }

  return {
    presentInBoth,
    missingInFirestore,
    extraInFirestore,
    duplicateExcel,
    duplicateFirestore,
  };
}

/* ============================================================
   PROGRAMME PRINCIPAL
============================================================ */

async function main() {
  console.log(
    "============================================"
  );
  console.log(
    "AUDIT FACTURES ET PROFORMAS VS FIRESTORE"
  );
  console.log(
    "============================================"
  );

  if (!fs.existsSync(EXCEL_PATH)) {
    throw new Error(
      `Fichier Excel introuvable : ${EXCEL_PATH}`
    );
  }

  const workbook =
    XLSX.readFile(EXCEL_PATH);

  console.log(
    "Feuilles disponibles :",
    workbook.SheetNames.join(", ")
  );

  const firebase =
    initFirebase();

  const db =
    firebase.firestore();

  /*
   * Lecture de tous les documents Firestore.
   *
   * Cela permettra plus tard de détecter aussi les documents
   * enregistrés avec un mauvais type.
   */
  const snapshot = await db
    .collection(COLLECTION_NAME)
    .get();

  const allFirestoreDocuments =
    snapshot.docs.map((doc) => {
      const data = doc.data();

      const rawNumber =
        firstNonEmpty(
          data,
          [
            "number",
            "invoiceNumber",
            "proformaNumber",
            "numero",
            "documentNumber",
          ]
        );

      return {
        firestoreId:
          doc.id,

        firestoreType:
          data.type ?? "",

        numberFirestore:
          rawNumber,

        normalizedNumber:
          normalizeDocumentNumber(
            rawNumber
          ),

        clientFirestore:
          data.clientName ?? "",

        fileName:
          data.fileName ?? "",

        importBatch:
          data.importBatch ?? "",
      };
    })
    .filter(
      (doc) => doc.normalizedNumber
    );

  console.log(
    "Total documents Firestore :",
    allFirestoreDocuments.length
  );

  const outputWorkbook =
    XLSX.utils.book_new();

  const globalSummary = [];

  for (const config of DOCUMENT_CONFIGS) {
    console.log("");
    console.log(
      `===== AUDIT ${config.label.toUpperCase()} =====`
    );

    const excelResult =
      readExcelDocuments(
        workbook,
        config
      );

    const firestoreDocuments =
      allFirestoreDocuments.filter(
        (doc) =>
          doc.firestoreType ===
          config.firestoreType
      );

    const auditResult =
      auditDocumentType({
        excelDocuments:
          excelResult.documents,

        firestoreDocuments,

        label:
          config.label,
      });

    const shortName =
      config.firestoreType === "invoice"
        ? "factures"
        : "proformas";

    globalSummary.push(
      {
        categorie:
          config.label,

        indicateur:
          "Documents dans Excel",

        valeur:
          excelResult.documents.length,
      },

      {
        categorie:
          config.label,

        indicateur:
          "Documents dans Firestore",

        valeur:
          firestoreDocuments.length,
      },

      {
        categorie:
          config.label,

        indicateur:
          "Présents dans Excel et Firestore",

        valeur:
          auditResult.presentInBoth.length,
      },

      {
        categorie:
          config.label,

        indicateur:
          "Présents dans Excel mais absents de Firestore",

        valeur:
          auditResult.missingInFirestore.length,
      },

      {
        categorie:
          config.label,

        indicateur:
          "Présents dans Firestore mais absents d'Excel",

        valeur:
          auditResult.extraInFirestore.length,
      },

      {
        categorie:
          config.label,

        indicateur:
          "Numéros dupliqués dans Excel",

        valeur:
          auditResult.duplicateExcel.length,
      },

      {
        categorie:
          config.label,

        indicateur:
          "Numéros dupliqués dans Firestore",

        valeur:
          auditResult.duplicateFirestore.length,
      }
    );

    appendWorksheet(
      outputWorkbook,
      auditResult.missingInFirestore,
      `missing_${shortName}`
    );

    appendWorksheet(
      outputWorkbook,
      auditResult.presentInBoth,
      `present_${shortName}`
    );

    appendWorksheet(
      outputWorkbook,
      auditResult.extraInFirestore,
      `extra_${shortName}`
    );

    appendWorksheet(
      outputWorkbook,
      auditResult.duplicateExcel,
      `duplicates_excel_${shortName}`
    );

    appendWorksheet(
      outputWorkbook,
      auditResult.duplicateFirestore,
      `duplicates_fs_${shortName}`
    );

    console.log(
      `${config.label} Excel :`,
      excelResult.documents.length
    );

    console.log(
      `${config.label} Firestore :`,
      firestoreDocuments.length
    );

    console.log(
      `${config.label} absentes de Firestore :`,
      auditResult.missingInFirestore.length
    );

    console.table(
      auditResult.missingInFirestore.map(
        (row) => ({
          number:
            row.numberExcel,

          client:
            row.clientExcel,

          normalized:
            row.normalizedNumber,
        })
      )
    );
  }

  /*
   * La feuille summary est ajoutée en dernier dans le code,
   * puis replacée en première position.
   */
  appendWorksheet(
    outputWorkbook,
    globalSummary,
    "summary"
  );

  outputWorkbook.SheetNames =
    [
      "summary",
      ...outputWorkbook.SheetNames.filter(
        (name) => name !== "summary"
      ),
    ];

  XLSX.writeFile(
    outputWorkbook,
    OUTPUT_PATH
  );

  console.log("");
  console.log(
    "============================================"
  );
  console.log(
    "RÉSUMÉ GLOBAL"
  );
  console.log(
    "============================================"
  );

  console.table(globalSummary);

  console.log("");
  console.log(
    `Rapport généré : ${OUTPUT_PATH}`
  );
}

main().catch((error) => {
  console.error(
    "Erreur fatale :",
    error
  );

  process.exit(1);
});