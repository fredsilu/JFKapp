import admin from "firebase-admin";
import fs from "fs";
import path from "path";

export function getFirestore() {
    if (admin.apps.length > 0) {
        return admin.firestore();
    }

    const serviceAccountPath = path.resolve("serviceAccountKey.json");

    if (!fs.existsSync(serviceAccountPath)) {
        throw new Error(
            "Fichier serviceAccountKey.json introuvable à la racine du projet."
        );
    }

    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });

    return admin.firestore();
}