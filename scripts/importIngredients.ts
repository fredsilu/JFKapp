import fs from "fs";
import path from "path";
import xlsx from "xlsx";

import admin from "firebase-admin";

import dotenv from "dotenv";

dotenv.config();

const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const FILE_PATH =
  "./jfkapp_ingredients_v2_with_prices.xlsx";

const DRY_RUN =
  process.argv.includes("--dry");

function normalizeString(value: string) {
  return value
    ?.trim()
    ?.toLowerCase()
    ?.normalize("NFD")
    ?.replace(/[\u0300-\u036f]/g, "");
}

async function run() {
  console.log("📦 Import ingrédients...");

  const workbook =
    xlsx.readFile(FILE_PATH);

  const sheetName =
    workbook.SheetNames[0];

  const sheet =
    workbook.Sheets[sheetName];

  const rows: any[] =
    xlsx.utils.sheet_to_json(sheet);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = row.name?.trim();

    if (!name) {
      skipped++;
      continue;
    }

    const normalizedName =
      normalizeString(name);

    const snapshot =
      await db
        .collection("ingredients")
        .where(
          "normalizedName",
          "==",
          normalizedName
        )
        .limit(1)
        .get();

    const data = {
      name,
      normalizedName,

      category:
        row.category || "EPICERIE",

      unit: row.unit || "pc",

      unitPrice: Number(
        row.estimatedUnitPriceUSD || 0
      ),

      currency:
        row.currency || "USD",

      supplier:
        row.supplier || "",

      stockTracked: true,

      isActive:
        String(row.isActive) === "true",

      priceConfidence:
        row.priceConfidence || "medium",

      priceSource:
        row.priceSource ||
        "manual",

      lastPriceUpdate:
        row.lastPriceUpdate || null,

      updatedAt:
        admin.firestore.FieldValue.serverTimestamp(),
    };

    if (snapshot.empty) {
      if (!DRY_RUN) {
        await db
          .collection("ingredients")
          .add({
            ...data,
            createdAt:
              admin.firestore.FieldValue.serverTimestamp(),
          });
      }

      created++;

      console.log(
        `✅ CREATED: ${name}`
      );
    } else {
      const doc =
        snapshot.docs[0];

      if (!DRY_RUN) {
        await doc.ref.update(data);
      }

      updated++;

      console.log(
        `♻️ UPDATED: ${name}`
      );
    }
  }

  const summary = {
    type: "ingredients_import",

    created,
    updated,
    skipped,

    dryRun: DRY_RUN,

    executedAt:
      admin.firestore.FieldValue.serverTimestamp(),
  };

  if (!DRY_RUN) {
    await db
      .collection("import_logs")
      .add(summary);
  }

  console.log("\n📊 IMPORT SUMMARY");
  console.log(summary);
}

run().catch(console.error);