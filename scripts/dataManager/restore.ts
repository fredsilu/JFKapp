import fs from "fs";
import path from "path";

import { APP_NAME, getCollectionsFromGroup } from "./config";
import { getFirestore } from "./firebaseAdmin";

import {
    askQuestion,
    ensureDir,
    getBackupBaseDir,
    getEnv,
    requireConfirmation,
    writeAuditLog,
} from "./utils";

const db = getFirestore();

type BackupPayload = {
    app: string;
    env: "test" | "production";
    group: string;
    createdAt: string;
    collections: Record<string, Array<{ id: string; data: any }>>;
};

function getLatestBackupFile(env: string, group: string) {
    const dir = getBackupBaseDir(env, group);

    if (!fs.existsSync(dir)) {
        throw new Error(`Aucun dossier backup trouvé : ${dir}`);
    }

    const files = fs
        .readdirSync(dir)
        .filter((file) => file.endsWith(".json"))
        .sort()
        .reverse();

    if (files.length === 0) {
        throw new Error(`Aucun backup JSON trouvé dans : ${dir}`);
    }

    return path.join(dir, files[0]);
}

function resolveBackupFile(env: string, group: string, backupArg: string) {
    if (backupArg === "latest") {
        return getLatestBackupFile(env, group);
    }

    const directPath = path.resolve(backupArg);

    if (fs.existsSync(directPath)) {
        return directPath;
    }

    const groupedPath = path.join(getBackupBaseDir(env, group), backupArg);

    if (fs.existsSync(groupedPath)) {
        return groupedPath;
    }

    throw new Error(`Backup introuvable : ${backupArg}`);
}

async function deleteCollection(collectionName: string) {
    const snapshot = await db.collection(collectionName).get();

    if (snapshot.empty) {
        console.log(`ℹ️ ${collectionName} : déjà vide`);
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

    console.log(`🗑️ ${collectionName} : ${total} documents supprimés`);
}

async function restoreCollection(
    collectionName: string,
    docs: Array<{ id: string; data: any }>
) {
    if (!docs || docs.length === 0) {
        console.log(`ℹ️ ${collectionName} : aucun document à restaurer`);
        return;
    }

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

    console.log(`✅ ${collectionName} : ${total} documents restaurés`);
}

async function createSafetyBackup(env: string, group: string) {
    const collections = getCollectionsFromGroup(group);
    const backup: Record<string, any[]> = {};

    for (const collectionName of collections) {
        const snapshot = await db.collection(collectionName).get();

        backup[collectionName] = snapshot.docs.map((doc) => ({
            id: doc.id,
            data: doc.data(),
        }));
    }

    const backupPayload = {
        app: APP_NAME,
        env,
        group: `${group}-before-restore`,
        createdAt: new Date().toISOString(),
        collections: backup,
    };

    const dir = path.resolve("backups", env, `${group}-before-restore`);
    ensureDir(dir);

    const filename = `${group}-before-restore-${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.json`;

    const fullPath = path.join(dir, filename);

    fs.writeFileSync(fullPath, JSON.stringify(backupPayload, null, 2), "utf8");

    writeAuditLog(`[SAFETY_BACKUP] env=${env} group=${group} file=${filename}`);

    console.log(`🛟 Backup de sécurité créé : ${fullPath}`);
}

async function requireProductionSecurity(group: string, backupFile: string) {
    const adminPassword = process.env.JFKAPP_ADMIN_RESTORE_PASSWORD;

    if (!adminPassword) {
        throw new Error(
            "Mot de passe admin manquant : ajoute JFKAPP_ADMIN_RESTORE_PASSWORD dans .env.production"
        );
    }

    const password = await askQuestion("Mot de passe administrateur : ");

    if (password !== adminPassword) {
        throw new Error("Mot de passe incorrect. Restore production annulé.");
    }

    console.log("");
    console.log("⚠️ RESTORE PRODUCTION");
    console.log(`Groupe : ${group}`);
    console.log(`Backup : ${backupFile}`);
    console.log("");

    await requireConfirmation("RESTORE_PRODUCTION_JFKAPP");
}

async function main() {
    const env = getEnv();

    const groupName = process.argv[2];
    const backupArg = process.argv[3];

    if (!groupName || !backupArg) {
        throw new Error(
            "Usage : npm run data:restore:test -- operations latest"
        );
    }

    const expectedCollections = getCollectionsFromGroup(groupName);
    const backupFile = resolveBackupFile(env, groupName, backupArg);

    const backup = JSON.parse(
        fs.readFileSync(backupFile, "utf8")
    ) as BackupPayload;

    if (backup.app !== APP_NAME) {
        throw new Error(`Backup invalide : app=${backup.app}`);
    }

    if (backup.env !== env) {
        throw new Error(
            `Backup environnement incompatible : backup=${backup.env}, actuel=${env}`
        );
    }

    if (backup.group !== groupName) {
        throw new Error(
            `Backup groupe incompatible : backup=${backup.group}, demandé=${groupName}`
        );
    }

    console.log("");
    console.log("================================");
    console.log("JFKAPP DATA RESTORE");
    console.log("================================");
    console.log("Environment :", env);
    console.log("Group       :", groupName);
    console.log("Backup      :", backupFile);
    console.log("Mode        :", env === "test" ? "REPLACE" : "MERGE");
    console.log("");

    for (const collectionName of expectedCollections) {
        const count = backup.collections[collectionName]?.length ?? 0;
        console.log(`- ${collectionName}: ${count} documents`);
    }

    console.log("");

    if (env === "production") {
        await requireProductionSecurity(groupName, backupFile);
        await createSafetyBackup(env, groupName);
    } else {
        await requireConfirmation("RESTORE_TEST_JFKAPP");
    }

    for (const collectionName of expectedCollections) {
        const docs = backup.collections[collectionName] ?? [];

        if (env === "test") {
            await deleteCollection(collectionName);
        }

        await restoreCollection(collectionName, docs);
    }

    writeAuditLog(
        `[RESTORE] env=${env} group=${groupName} file=${path.basename(
            backupFile
        )} mode=${env === "test" ? "REPLACE" : "MERGE"}`
    );

    console.log("");
    console.log("🎉 Restore terminé avec succès");
    console.log("");
}

main().catch((error) => {
    console.error("");
    console.error("❌ Restore échoué");
    console.error(error);
    console.error("");

    process.exit(1);
});