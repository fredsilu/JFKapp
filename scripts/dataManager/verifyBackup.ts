import fs from "fs";
import path from "path";

import { APP_NAME, getCollectionsFromGroup } from "./config";
import { getBackupBaseDir, getEnv } from "./utils";

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

async function main() {
    const env = getEnv();

    const groupName = process.argv[2];
    const backupArg = process.argv[3];

    if (!groupName || !backupArg) {
        throw new Error("Usage : npm run data:verify:test -- operations latest");
    }

    const expectedCollections = getCollectionsFromGroup(groupName);
    const backupFile = resolveBackupFile(env, groupName, backupArg);

    const backup = JSON.parse(
        fs.readFileSync(backupFile, "utf8")
    ) as BackupPayload;

    console.log("");
    console.log("================================");
    console.log("JFKAPP BACKUP VERIFY");
    console.log("================================");
    console.log("");

    if (backup.app !== APP_NAME) {
        throw new Error(`Backup invalide : app=${backup.app}`);
    }

    if (backup.env !== env) {
        throw new Error(
            `Environnement incompatible : backup=${backup.env}, actuel=${env}`
        );
    }

    if (backup.group !== groupName) {
        throw new Error(
            `Groupe incompatible : backup=${backup.group}, demandé=${groupName}`
        );
    }

    let total = 0;

    console.log("✅ Backup valide");
    console.log("");
    console.log("App         :", backup.app);
    console.log("Environment :", backup.env);
    console.log("Group       :", backup.group);
    console.log("Created At  :", backup.createdAt);
    console.log("File        :", backupFile);
    console.log("");
    console.log("Collections");
    console.log("-----------");

    for (const collectionName of expectedCollections) {
        const docs = backup.collections[collectionName];

        if (!docs) {
            throw new Error(`Collection manquante dans le backup : ${collectionName}`);
        }

        total += docs.length;
        console.log(`${collectionName.padEnd(22)} : ${docs.length}`);
    }

    console.log("");
    console.log(`TOTAL : ${total} documents`);
    console.log("");
}

main().catch((error) => {
    console.error("");
    console.error("❌ Vérification échouée");
    console.error(error);
    console.error("");

    process.exit(1);
});