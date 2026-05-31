import fs from "fs";
import path from "path";

import { APP_NAME, getCollectionsFromGroup } from "./config";
import { getFirestore } from "./firebaseAdmin";

import {
    ensureDir,
    getBackupBaseDir,
    getEnv,
    getTimestamp,
    requireConfirmation,
    writeAuditLog,
} from "./utils";

const db = getFirestore();

async function exportCollection(collectionName: string) {
    const snapshot = await db.collection(collectionName).get();

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
    }));
}

async function createBackup(env: string, group: string) {
    const collections = getCollectionsFromGroup(group);

    const backup: Record<string, any[]> = {};

    for (const collectionName of collections) {
        backup[collectionName] =
            await exportCollection(collectionName);
    }

    const payload = {
        app: APP_NAME,
        env,
        group,
        createdAt: new Date().toISOString(),
        collections: backup,
    };

    const dir = getBackupBaseDir(env, group);

    ensureDir(dir);

    const filename =
        `${group}-before-reset-${getTimestamp()}.json`;

    const fullPath = path.join(dir, filename);

    fs.writeFileSync(
        fullPath,
        JSON.stringify(payload, null, 2),
        "utf8"
    );

    console.log("");
    console.log("🛟 Backup automatique créé");
    console.log(fullPath);
    console.log("");

    return fullPath;
}

async function deleteCollection(collectionName: string) {
    const snapshot =
        await db.collection(collectionName).get();

    if (snapshot.empty) {
        console.log(
            `ℹ️ ${collectionName} : déjà vide`
        );
        return;
    }

    let batch = db.batch();
    let count = 0;
    let total = 0;

    for (const doc of snapshot.docs) {
        batch.delete(doc.ref);

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

    console.log(
        `🗑️ ${collectionName} : ${total} supprimés`
    );
}

async function main() {
    const env = getEnv();

    if (env !== "test") {
        throw new Error(
            "RESET INTERDIT EN PRODUCTION"
        );
    }

    const groupName = process.argv[2];

    if (!groupName) {
        throw new Error(
            "Usage : npm run data:reset:test -- operations"
        );
    }

    const collections =
        getCollectionsFromGroup(groupName);

    console.log("");
    console.log("================================");
    console.log("JFKAPP DATA RESET");
    console.log("================================");
    console.log("Environment :", env);
    console.log("Group       :", groupName);
    console.log("");

    for (const collectionName of collections) {
        const snapshot =
            await db.collection(collectionName).get();

        console.log(
            `${collectionName}: ${snapshot.size} documents`
        );
    }

    await createBackup(env, groupName);

    console.log("");
    console.log("⚠️ ATTENTION");
    console.log(
        "Toutes les données du groupe vont être supprimées."
    );
    console.log("");

    await requireConfirmation(
        "RESET_TEST_JFKAPP"
    );

    for (const collectionName of collections) {
        await deleteCollection(collectionName);
    }

    writeAuditLog(
        `[RESET] env=${env} group=${groupName}`
    );

    console.log("");
    console.log(
        "✅ Reset terminé avec succès"
    );
    console.log("");
}

main().catch((error) => {
    console.error("");
    console.error("❌ Reset échoué");
    console.error(error);
    console.error("");

    process.exit(1);
});