import fs from "fs";
import path from "path";

import { getEnv } from "./utils";

function listDirectory(dir: string) {
    if (!fs.existsSync(dir)) {
        return [];
    }

    return fs
        .readdirSync(dir)
        .filter((file) => file.endsWith(".json"))
        .sort()
        .reverse();
}

async function main() {
    const env = getEnv();

    const baseDir = path.resolve("backups", env);

    console.log("");
    console.log("================================");
    console.log("JFKAPP BACKUP LIST");
    console.log("================================");
    console.log(`Environment : ${env}`);
    console.log("");

    if (!fs.existsSync(baseDir)) {
        console.log("Aucun backup trouvé.");
        return;
    }

    const groups = fs
        .readdirSync(baseDir)
        .filter((item) =>
            fs.statSync(path.join(baseDir, item)).isDirectory()
        )
        .sort();

    if (groups.length === 0) {
        console.log("Aucun groupe trouvé.");
        return;
    }

    for (const group of groups) {
        console.log(group);
        console.log("-".repeat(group.length));

        const files = listDirectory(
            path.join(baseDir, group)
        );

        if (files.length === 0) {
            console.log("  Aucun backup");
            console.log("");
            continue;
        }

        for (const file of files) {
            console.log(`  ${file}`);
        }

        console.log("");
    }
}

main().catch((error) => {
    console.error("");
    console.error("❌ Erreur");
    console.error(error);
    console.error("");

    process.exit(1);
});