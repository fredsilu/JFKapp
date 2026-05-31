import fs from "fs";
import path from "path";

import { APP_NAME, getCollectionsFromGroup } from "./config";
import { getFirestore } from "./firebaseAdmin";

import {
    ensureDir,
    getBackupBaseDir,
    getEnv,
    getTimestamp,
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

async function main() {
    const env = getEnv();

    const groupName = process.argv[2];

    if (!groupName) {
        throw new Error(
            "Usage : npm run data:backup:test -- operations"
        );
    }

    const collections =
        getCollectionsFromGroup(groupName);

    console.log("");
    console.log("================================");
    console.log("JFKAPP DATA BACKUP");
    console.log("================================");
    console.log("Environment :", env);
    console.log("Group       :", groupName);
    console.log("");

    const backup: Record<string, any> = {};

    for (const collectionName of collections) {
        console.log(
            `📦 Export ${collectionName} ...`
        );

        backup[collectionName] =
            await exportCollection(collectionName);

        console.log(
            `   ${backup[collectionName].length} documents`
        );
    }

    const backupPayload = {
        app: APP_NAME,
        env,
        group: groupName,
        createdAt: new Date().toISOString(),
        collections: backup,
    };

    const backupDir =
        getBackupBaseDir(env, groupName);

    ensureDir(backupDir);

    const filename =
        `${groupName}-${getTimestamp()}.json`;

    const fullPath = path.join(
        backupDir,
        filename
    );

    fs.writeFileSync(
        fullPath,
        JSON.stringify(
            backupPayload,
            null,
            2
        ),
        "utf8"
    );

    writeAuditLog(
        `[BACKUP] env=${env} group=${groupName} file=${filename}`
    );

    console.log("");
    console.log(
        `✅ Backup terminé`
    );
    console.log(
        `📁 ${fullPath}`
    );
    console.log("");
}

main().catch((error) => {
    console.error("");
    console.error("❌ Backup échoué");
    console.error(error);
    console.error("");

    process.exit(1);
});