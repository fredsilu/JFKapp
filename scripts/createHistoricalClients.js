const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const SERVICE_ACCOUNT_PATH = path.resolve("serviceAccountKey.json");

function initFirebase() {
    if (admin.apps.length > 0) return admin;

    if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
        throw new Error("serviceAccountKey.json introuvable à la racine du projet.");
    }

    admin.initializeApp({
        credential: admin.credential.cert(require(SERVICE_ACCOUNT_PATH)),
    });

    return admin;
}

function normalizeName(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\b(sarl|sprl|sa|ltd|llc|inc|rdc|drc|kinshasa|kin)\b/g, "")
        .replace(/[^a-z0-9]/g, "");
}

function cleanString(value) {
    return String(value || "").trim();
}

async function loadExistingClients(db) {
    const snap = await db.collection("clients").get();
    const map = new Map();

    snap.docs.forEach((doc) => {
        const data = doc.data();
        const name = cleanString(data.name);
        const key = normalizeName(name);

        if (key) {
            map.set(key, {
                id: doc.id,
                name,
            });
        }
    });

    console.log(`Clients existants chargés : ${map.size}`);
    return map;
}

async function loadHistoricalClientGroups(db) {
    const snap = await db
        .collection("archived_documents")
        .where("clientMatchStatus", "==", "new_historical_client")
        .get();

    const groups = new Map();

    snap.docs.forEach((doc) => {
        const data = doc.data();
        const clientName = cleanString(data.clientName);

        if (!clientName) return;

        const key = normalizeName(clientName);

        if (!groups.has(key)) {
            groups.set(key, {
                clientName,
                docs: [],
            });
        }

        groups.get(key).docs.push({
            id: doc.id,
            type: data.type,
        });
    });

    console.log(`Clients historiques à créer/rattacher : ${groups.size}`);
    console.log(`Archives concernées : ${snap.size}`);

    return groups;
}

async function createClientIfNeeded(db, existingClients, clientName) {
    const key = normalizeName(clientName);
    const existing = existingClients.get(key);

    if (existing) {
        return existing;
    }

    const ref = await db.collection("clients").add({
        name: clientName,
        phone: "",
        email: "",
        address: "",
        notes:
            "Client créé automatiquement lors de l'import des archives historiques Crepolia. Informations à compléter si nécessaire.",
        totalOrders: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const created = {
        id: ref.id,
        name: clientName,
    };

    existingClients.set(key, created);

    console.log(`➕ Client créé : ${clientName}`);
    return created;
}

async function updateArchives(db, docs, client) {
    const batchSize = 450;
    let updated = 0;

    for (let i = 0; i < docs.length; i += batchSize) {
        const batch = db.batch();
        const slice = docs.slice(i, i + batchSize);

        slice.forEach((archive) => {
            const ref = db.collection("archived_documents").doc(archive.id);

            batch.update(ref, {
                clientId: client.id,
                clientName: client.name,
                clientMatchStatus: "mapped",
                clientMatchReason: "client créé ou retrouvé depuis archives historiques",
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        });

        await batch.commit();
        updated += slice.length;
    }

    return updated;
}

async function main() {
    console.log("===== CREATE HISTORICAL CLIENTS JFKAPP =====");

    const firebase = initFirebase();
    const db = firebase.firestore();

    const existingClients = await loadExistingClients(db);
    const groups = await loadHistoricalClientGroups(db);

    let createdOrFound = 0;
    let totalUpdatedArchives = 0;

    for (const group of groups.values()) {
        const client = await createClientIfNeeded(
            db,
            existingClients,
            group.clientName
        );

        const updated = await updateArchives(db, group.docs, client);

        createdOrFound++;
        totalUpdatedArchives += updated;

        console.log(
            `✅ ${client.name} → ${updated} archive(s) rattachée(s)`
        );
    }

    console.log("===== RÉSUMÉ =====");
    console.log("Clients traités :", createdOrFound);
    console.log("Archives mises à jour :", totalUpdatedArchives);
}

main().catch((error) => {
    console.error("Erreur fatale:", error);
    process.exit(1);
});