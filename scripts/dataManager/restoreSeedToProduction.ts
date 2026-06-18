import fs from "fs";
import path from "path";
import { getFirestore } from "./firebaseAdmin";
import { askQuestion, requireConfirmation } from "./utils";

const db = getFirestore();

const ALLOWED_COLLECTIONS = [
  "clients",
  "ingredients",
  "dishes",
  "catering_service_settings",
  "catering_section_templates",
];

function getLatestSeedBackup() {
  const dir = path.resolve("backups", "test", "production_seed");

  const files = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .reverse();

  if (files.length === 0) {
    throw new Error("Aucun backup production_seed trouvé.");
  }

  return path.join(dir, files[0]);
}

async function restoreCollection(collectionName: string, docs: any[]) {
  let batch = db.batch();
  let count = 0;
  let total = 0;

  for (const item of docs) {
    const ref = db.collection(collectionName).doc(item.id);
    batch.set(ref, item.data, { merge: true });

    count++;
    total++;

    if (count === 400) {
      await batch.commit();
      batch = db.batch();
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
  }

  console.log(`✅ ${collectionName}: ${total} documents migrés`);
}

async function main() {
  const password = process.env.JFKAPP_ADMIN_RESTORE_PASSWORD;

  if (!password) {
    throw new Error("JFKAPP_ADMIN_RESTORE_PASSWORD manquant dans .env.production");
  }

  const typedPassword = await askQuestion("Mot de passe admin PROD : ");

  if (typedPassword !== password) {
    throw new Error("Mot de passe incorrect.");
  }

  const backupFile = getLatestSeedBackup();
  const backup = JSON.parse(fs.readFileSync(backupFile, "utf8"));

  console.log("");
  console.log("Migration TEST → PROD");
  console.log("Backup :", backupFile);
  console.log("");

  for (const collectionName of ALLOWED_COLLECTIONS) {
    const count = backup.collections?.[collectionName]?.length ?? 0;
    console.log(`- ${collectionName}: ${count}`);
  }

  console.log("");
  await requireConfirmation("MIGRATE_SEED_TO_PRODUCTION");

  for (const collectionName of ALLOWED_COLLECTIONS) {
    const docs = backup.collections?.[collectionName] ?? [];
    await restoreCollection(collectionName, docs);
  }

  console.log("");
  console.log("🎉 Migration terminée.");
}

main().catch((error) => {
  console.error("❌ Migration échouée");
  console.error(error);
  process.exit(1);
});