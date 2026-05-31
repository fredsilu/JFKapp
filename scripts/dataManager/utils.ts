import fs from "fs";
import path from "path";
import readline from "readline";

export function getEnv(): "test" | "production" {
    const env = process.env.APP_ENV;

    if (env !== "test" && env !== "production") {
        throw new Error(
            `APP_ENV invalide : ${env}. Valeurs autorisées : test ou production.`
        );
    }

    return env;
}

export function ensureDir(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

export function getTimestamp() {
    return new Date().toISOString().replace(/[:.]/g, "-");
}

export function getBackupBaseDir(env: string, group: string) {
    return path.resolve("backups", env, group);
}

export function askQuestion(question: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

export async function requireConfirmation(expectedText: string) {
    const answer = await askQuestion(
        `Tape exactement "${expectedText}" pour confirmer : `
    );

    if (answer !== expectedText) {
        throw new Error("Confirmation incorrecte. Opération annulée.");
    }
}

export function writeAuditLog(message: string) {
    ensureDir(path.resolve("logs"));

    const line = `[${new Date().toISOString()}] ${message}\n`;

    fs.appendFileSync(path.resolve("logs", "audit.log"), line, "utf8");
}