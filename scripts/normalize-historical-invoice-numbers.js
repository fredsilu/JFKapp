require("dotenv").config({
  path: ".env.production",
});

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

/* ============================================================
   CONFIGURATION
============================================================ */

const SERVICE_ACCOUNT_PATH = path.resolve("serviceAccountKey.json");

const COLLECTION_NAME = "archived_documents";

const MIGRATION_VERSION = "v3.5-historical-invoice-number-normalization";

const BATCH_SIZE = 450;

/**
 * DRY RUN par défaut.
 *
 * Écriture réelle avec :
 * --commit
 * ou
 * --execute
 */
const IS_COMMIT =
  process.argv.includes("--commit") || process.argv.includes("--execute");

/* ============================================================
   FIREBASE
============================================================ */

function initFirebase() {
  if (admin.apps.length > 0) {
    return admin;
  }

  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    throw new Error(
      `serviceAccountKey.json introuvable : ${SERVICE_ACCOUNT_PATH}`,
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert(require(SERVICE_ACCOUNT_PATH)),
  });

  return admin;
}

/* ============================================================
   UTILITAIRES
============================================================ */

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeForComparison(value) {
  return cleanText(value).toLowerCase();
}

/**
 * Convertit les anciens numéros :
 *
 * facture_CR2026_FC_49   → CR2026-FC-049
 * facture_CR2026_FC_8    → CR2026-FC-008
 * facture_CR2026_FC_123  → CR2026-FC-123
 * facture_CR2023_FC_037  → CR2023-FC-037
 *
 * Accepte aussi certaines variantes de séparateurs.
 */
function normalizeHistoricalInvoiceNumber(value) {
  let text = cleanText(value);

  if (!text) {
    return null;
  }

  text = text
    .replace(/\.pdf$/i, "")
    .replace(/^facture[\s_-]*/i, "")
    .replace(/[\s_./\\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  const match = text.match(/^CR(\d{4})-FC-(\d+)([A-Z]*)$/i);

  if (!match) {
    return null;
  }

  const year = match[1];
  const sequence = match[2].padStart(3, "0");
  const suffix = cleanText(match[3]).toUpperCase();

  return `CR${year}-FC-${sequence}${suffix}`;
}

function buildNormalizedNumber(number) {
  return cleanText(number).toLowerCase();
}

function buildFileName(currentFileName, newNumber) {
  const current = cleanText(currentFileName);

  if (!current) {
    return `${newNumber}.pdf`;
  }

  const extensionMatch = current.match(/(\.[a-z0-9]+)$/i);
  const extension = extensionMatch ? extensionMatch[1].toLowerCase() : ".pdf";

  return `${newNumber}${extension}`;
}

function isAlreadyCompliant(value) {
  const text = cleanText(value);

  return /^CR\d{4}-FC-\d{3,}[A-Z]*$/i.test(text);
}

/* ============================================================
   CHARGEMENT DES ARCHIVES
============================================================ */

async function loadInvoiceArchives(db) {
  const snapshot = await db
    .collection(COLLECTION_NAME)
    .where("type", "==", "invoice")
    .get();

  console.log(`Archives de type invoice chargées : ${snapshot.size}`);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ref: document.ref,
    data: document.data(),
  }));
}

/* ============================================================
   PRÉPARATION DES MIGRATIONS
============================================================ */

function prepareMigrations(documents) {
  const results = [];

  const stats = {
    analyzed: documents.length,
    toUpdate: 0,
    alreadyCompliant: 0,
    unsupportedFormat: 0,
    missingNumber: 0,
    conflicts: 0,
  };

  /**
   * Index des numéros existants pour détecter les collisions.
   */
  const currentNumberIndex = new Map();

  documents.forEach((document) => {
    const currentNumber = cleanText(document.data.number);

    if (!currentNumber) return;

    const key = normalizeForComparison(currentNumber);

    if (!currentNumberIndex.has(key)) {
      currentNumberIndex.set(key, []);
    }

    currentNumberIndex.get(key).push(document.id);
  });

  /**
   * Index des nouveaux numéros calculés.
   */
  const targetNumberIndex = new Map();

  documents.forEach((document) => {
    const data = document.data;

    const oldNumber = cleanText(data.number);
    const oldNormalizedNumber = cleanText(data.normalizedNumber);
    const oldFileName = cleanText(data.fileName);

    if (!oldNumber) {
      stats.missingNumber++;

      results.push({
        status: "SKIPPED_MISSING_NUMBER",
        id: document.id,
        oldNumber: "",
        newNumber: "",
        oldNormalizedNumber,
        newNormalizedNumber: "",
        oldFileName,
        newFileName: "",
        reason: "Champ number absent",
        ref: document.ref,
      });

      return;
    }

    const newNumber = normalizeHistoricalInvoiceNumber(oldNumber);

    if (!newNumber) {
      stats.unsupportedFormat++;

      results.push({
        status: "SKIPPED_UNSUPPORTED_FORMAT",
        id: document.id,
        oldNumber,
        newNumber: "",
        oldNormalizedNumber,
        newNormalizedNumber: "",
        oldFileName,
        newFileName: "",
        reason: "Format de numéro non reconnu",
        ref: document.ref,
      });

      return;
    }

    const newNormalizedNumber = buildNormalizedNumber(newNumber);

    const newFileName = buildFileName(oldFileName, newNumber);

    const numberAlreadyCorrect = oldNumber === newNumber;

    const normalizedAlreadyCorrect =
      oldNormalizedNumber === newNormalizedNumber;

    const fileNameAlreadyCorrect = oldFileName === newFileName;

    if (
      numberAlreadyCorrect &&
      normalizedAlreadyCorrect &&
      fileNameAlreadyCorrect
    ) {
      stats.alreadyCompliant++;

      results.push({
        status: "ALREADY_COMPLIANT",
        id: document.id,
        oldNumber,
        newNumber,
        oldNormalizedNumber,
        newNormalizedNumber,
        oldFileName,
        newFileName,
        reason: "Les trois champs sont déjà conformes",
        ref: document.ref,
      });

      return;
    }

    const targetKey = normalizeForComparison(newNumber);

    if (!targetNumberIndex.has(targetKey)) {
      targetNumberIndex.set(targetKey, []);
    }

    targetNumberIndex.get(targetKey).push({
      id: document.id,
      oldNumber,
    });

    results.push({
      status: "READY",
      id: document.id,
      oldNumber,
      newNumber,
      oldNormalizedNumber,
      newNormalizedNumber,
      oldFileName,
      newFileName,
      reason: "",
      ref: document.ref,
    });
  });

  /**
   * Détection des collisions :
   * plusieurs documents qui deviendraient le même numéro.
   */
  for (const [targetKey, candidates] of targetNumberIndex) {
    if (candidates.length <= 1) {
      continue;
    }

    candidates.forEach((candidate) => {
      const result = results.find((item) => item.id === candidate.id);

      if (!result || result.status !== "READY") {
        return;
      }

      result.status = "SKIPPED_CONFLICT";
      result.reason = `Plusieurs archives produisent le même numéro cible : ${targetKey}`;

      stats.conflicts++;
    });
  }

  /**
   * Vérifie également qu'un autre document possède déjà
   * exactement le numéro cible.
   */
  results.forEach((result) => {
    if (result.status !== "READY") return;

    const targetKey = normalizeForComparison(result.newNumber);

    const existingDocumentIds = currentNumberIndex.get(targetKey) ?? [];

    const otherIds = existingDocumentIds.filter((id) => id !== result.id);

    if (otherIds.length > 0) {
      result.status = "SKIPPED_CONFLICT";
      result.reason = `Le numéro cible existe déjà sur : ${otherIds.join(", ")}`;

      stats.conflicts++;
    }
  });

  stats.toUpdate = results.filter((result) => result.status === "READY").length;

  return {
    results,
    stats,
  };
}

/* ============================================================
   AFFICHAGE DU DRY RUN
============================================================ */

function printPreparedChanges(results) {
  const ready = results.filter((result) => result.status === "READY");

  if (ready.length === 0) {
    console.log("");
    console.log("Aucune archive à modifier.");
    return;
  }

  console.log("");
  console.log("===== MODIFICATIONS PRÉVUES =====");

  ready.forEach((result) => {
    console.log("");
    console.log(`Document : ${result.id}`);
    console.log(
      `  number           : ${result.oldNumber} → ${result.newNumber}`,
    );
    console.log(
      `  normalizedNumber : ${result.oldNormalizedNumber || "(vide)"} → ${result.newNormalizedNumber}`,
    );
    console.log(
      `  fileName         : ${result.oldFileName || "(vide)"} → ${result.newFileName}`,
    );
  });
}

function printSkippedDocuments(results) {
  const skipped = results.filter(
    (result) =>
      result.status !== "READY" && result.status !== "ALREADY_COMPLIANT",
  );

  if (skipped.length === 0) {
    return;
  }

  console.log("");
  console.log("===== DOCUMENTS IGNORÉS =====");

  skipped.forEach((result) => {
    console.log(
      `${result.status} | ${result.id} | ` +
        `${result.oldNumber || "(sans numéro)"} | ` +
        `${result.reason}`,
    );
  });
}

/* ============================================================
   ÉCRITURE FIRESTORE
============================================================ */

async function commitMigrations(db, readyResults) {
  let updated = 0;

  for (let index = 0; index < readyResults.length; index += BATCH_SIZE) {
    const slice = readyResults.slice(index, index + BATCH_SIZE);

    const batch = db.batch();

    slice.forEach((result) => {
      batch.update(result.ref, {
        number: result.newNumber,
        normalizedNumber: result.newNormalizedNumber,
        fileName: result.newFileName,

        numberMigration: MIGRATION_VERSION,

        numberMigrationAt: admin.firestore.FieldValue.serverTimestamp(),

        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    updated += slice.length;

    console.log(
      `✅ Batch validé : ${slice.length} document(s) — ` +
        `${updated}/${readyResults.length}`,
    );
  }

  return updated;
}

/* ============================================================
   CONTRÔLE APRÈS MIGRATION
============================================================ */

async function verifyMigration(db, expectedResults) {
  let verified = 0;
  let failed = 0;

  console.log("");
  console.log("===== VÉRIFICATION POST-MIGRATION =====");

  for (const result of expectedResults) {
    const snapshot = await result.ref.get();

    if (!snapshot.exists) {
      failed++;

      console.error(`❌ Document introuvable après migration : ${result.id}`);

      continue;
    }

    const data = snapshot.data();

    const isValid =
      data.number === result.newNumber &&
      data.normalizedNumber === result.newNormalizedNumber &&
      data.fileName === result.newFileName;

    if (isValid) {
      verified++;
    } else {
      failed++;

      console.error(`❌ Vérification échouée : ${result.id}`, {
        expected: {
          number: result.newNumber,
          normalizedNumber: result.newNormalizedNumber,
          fileName: result.newFileName,
        },
        actual: {
          number: data.number,
          normalizedNumber: data.normalizedNumber,
          fileName: data.fileName,
        },
      });
    }
  }

  console.log("Documents vérifiés :", verified);
  console.log("Échecs de vérification :", failed);

  return {
    verified,
    failed,
  };
}

/* ============================================================
   PROGRAMME PRINCIPAL
============================================================ */

async function main() {
  console.log("====================================================");
  console.log("NORMALISATION DES NUMÉROS DE FACTURES HISTORIQUES");
  console.log("====================================================");

  console.log(
    "Mode :",
    IS_COMMIT ? "COMMIT — ÉCRITURE ACTIVE" : "DRY RUN — AUCUNE ÉCRITURE",
  );

  console.log("Collection :", COLLECTION_NAME);

  console.log("Migration :", MIGRATION_VERSION);

  const firebase = initFirebase();
  const db = firebase.firestore();

  const documents = await loadInvoiceArchives(db);

  const { results, stats } = prepareMigrations(documents);

  printPreparedChanges(results);
  printSkippedDocuments(results);

  const readyResults = results.filter((result) => result.status === "READY");

  console.log("");
  console.log("===== RÉSUMÉ AVANT EXÉCUTION =====");

  console.table([
    {
      indicateur: "Documents analysés",
      valeur: stats.analyzed,
    },
    {
      indicateur: "Documents à modifier",
      valeur: stats.toUpdate,
    },
    {
      indicateur: "Déjà conformes",
      valeur: stats.alreadyCompliant,
    },
    {
      indicateur: "Sans numéro",
      valeur: stats.missingNumber,
    },
    {
      indicateur: "Formats non reconnus",
      valeur: stats.unsupportedFormat,
    },
    {
      indicateur: "Conflits",
      valeur: stats.conflicts,
    },
  ]);

  if (!IS_COMMIT) {
    console.log("");
    console.log("🧪 DRY RUN terminé : aucune donnée n'a été modifiée.");

    console.log("");
    console.log("Après validation, exécute :");

    console.log(
      "node scripts/normalize-historical-invoice-numbers.js --commit",
    );

    return;
  }

  if (readyResults.length === 0) {
    console.log("");
    console.log("Aucune donnée à mettre à jour.");

    return;
  }

  console.log("");
  console.log("⚠️ ÉCRITURE FIRESTORE EN COURS...");

  const updated = await commitMigrations(db, readyResults);

  const verification = await verifyMigration(db, readyResults);

  console.log("");
  console.log("===== RÉSUMÉ FINAL =====");

  console.table([
    {
      indicateur: "Documents analysés",
      valeur: stats.analyzed,
    },
    {
      indicateur: "Documents modifiés",
      valeur: updated,
    },
    {
      indicateur: "Documents vérifiés",
      valeur: verification.verified,
    },
    {
      indicateur: "Échecs de vérification",
      valeur: verification.failed,
    },
    {
      indicateur: "Déjà conformes",
      valeur: stats.alreadyCompliant,
    },
    {
      indicateur: "Formats non reconnus",
      valeur: stats.unsupportedFormat,
    },
    {
      indicateur: "Conflits ignorés",
      valeur: stats.conflicts,
    },
  ]);

  if (verification.failed > 0) {
    throw new Error(
      `${verification.failed} document(s) n'ont pas passé la vérification post-migration.`,
    );
  }

  console.log("");
  console.log("✅ Migration terminée avec succès.");

  console.log(
    "Les champs pdfUrl, storagePath et originalFilePath n'ont pas été modifiés.",
  );
}

main().catch((error) => {
  console.error("");
  console.error("ERREUR FATALE :", error);

  console.error(error.stack ?? "");

  process.exit(1);
});
