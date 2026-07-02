//scripts/import-historical-archives.js
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const EXCEL_PATH =
    "B:/Professionnel/Creperie/Clientele/Archives_Crepolia/audit_import_archives_v4.xlsx";

const CLIENT_MAPPING_PATH =
    "B:/Professionnel/Creperie/Clientele/Archives_Crepolia/archive_client_mapping_v1.xlsx";
const SERVICE_ACCOUNT_PATH = path.resolve("serviceAccountKey.json");
const COLLECTION_NAME = "archived_documents";

const IS_TEST = process.argv.includes("--test");
const IS_DRY_RUN = process.argv.includes("--dry-run");

const TEST_PROFORMA_LIMIT = 3;
const TEST_INVOICE_LIMIT = 2;

function normalizeName(value) {
    return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\b(sarl|sprl|sa|ltd|llc|inc|rdc|drc|kinshasa|kin)\b/g, "")
        .replace(/[^a-z0-9]/g, "")
        .trim();
}

function initFirebase() {
    if (admin.apps.length > 0) return admin;

    if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
        throw new Error("serviceAccountKey.json introuvable à la racine du projet.");
    }

    const storageBucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;

    if (!storageBucket) {
        throw new Error("EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET manquant.");
    }

    console.log("PROJECT_ID:", process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID);
    console.log("STORAGE_BUCKET:", storageBucket);

    admin.initializeApp({
        credential: admin.credential.cert(require(SERVICE_ACCOUNT_PATH)),
        storageBucket,
    });

    return admin;
}

function readSheet(workbook, sheetName) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) throw new Error(`Onglet introuvable : ${sheetName}`);
    return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

function addMappingKey(mapping, rawName, finalClientName) {
    const key = normalizeName(rawName);
    if (key) mapping.set(key, finalClientName);

    const withoutPeople = normalizeName(
        String(rawName || "")
            .replace(/\b(willy|nana|lulu|betina)\b/gi, "")
    );

    if (withoutPeople) mapping.set(withoutPeople, finalClientName);
}

function loadClientMapping() {
    if (!fs.existsSync(CLIENT_MAPPING_PATH)) {
        throw new Error(`Mapping client introuvable : ${CLIENT_MAPPING_PATH}`);
    }

    const workbook = XLSX.readFile(CLIENT_MAPPING_PATH);
    const rows = readSheet(workbook, "client_mapping");

    const mapping = new Map();

    for (const row of rows) {
        const finalClientName = cleanString(row.finalClientName);
        if (!finalClientName) continue;

        const names = [
            row.historicalGroupName,
            ...(String(row.aliases || "").split("|")),
        ];

        for (const name of names) {
            addMappingKey(mapping, name, finalClientName);
        }
    }

    console.log(`Mappings clients chargés: ${mapping.size}`);
    return mapping;
}

function buildClientsByName(clients) {
    const map = new Map();

    for (const client of clients) {
        const key = normalizeName(client.name);
        if (key) map.set(key, client);
    }

    console.log(`Index clients par nom: ${map.size}`);
    return map;
}

function excelDateToISO(value) {
    if (!value) return undefined;

    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed || trimmed.toLowerCase() === "ok" || trimmed.toLowerCase() === "annulé") {
            return undefined;
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

        const parsed = new Date(trimmed);
        if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);

        return trimmed;
    }

    if (typeof value === "number") {
        const parsed = XLSX.SSF.parse_date_code(value);
        if (!parsed) return undefined;

        return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
    }

    return undefined;
}

function cleanString(value) {
    const text = String(value || "").trim();
    return text || undefined;
}

function cleanAmount(value) {
    if (value === "" || value === null || value === undefined) return undefined;

    const amount = Number(
        String(value).replace(",", ".").replace(/\s/g, "").trim()
    );

    return Number.isFinite(amount) ? amount : undefined;
}

function sanitizeFileName(value) {
    return String(value || "")
        .trim()
        .replace(/[^\w.-]+/g, "_")
        .replace(/_+/g, "_");
}

async function loadClientsMap(db) {
    const snap = await db.collection("clients").get();

    const clients = snap.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name || "",
            normalizedName: normalizeName(data.name || ""),
        };
    });

    console.log(`Clients app chargés: ${clients.length}`);
    return clients;
}

function findClientMatch(row, clientsByName, clientMapping) {
    const candidates = [
        cleanString(row.clientFolder),
        cleanString(row.clientExcel),
    ].filter(Boolean);

    for (const candidate of candidates) {
        const key = normalizeName(candidate);
        const finalClientName = clientMapping.get(key);

        if (!finalClientName) continue;

        const clientKey = normalizeName(finalClientName);
        const client = clientsByName.get(clientKey);

        if (client) {
            return {
                clientId: client.id,
                clientName: client.name,
                historicalClientName: candidate,
                clientMatchStatus: "mapped",
                clientMatchReason: `mapping:${candidate}->${client.name}`,
            };
        }

        return {
            clientId: undefined,
            clientName: finalClientName,
            historicalClientName: candidate,
            clientMatchStatus: "new_historical_client",
            clientMatchReason: `client historique non présent dans la base clients: ${finalClientName}`,
        };
    }

    return {
        clientId: undefined,
        clientName: cleanString(row.clientExcel) || cleanString(row.clientFolder) || "",
        historicalClientName: cleanString(row.clientFolder) || cleanString(row.clientExcel),
        clientMatchStatus: "unmapped",
        clientMatchReason: "aucune clé trouvée dans archive_client_mapping_v1.xlsx",
    };
}

async function uploadPdf(bucket, row, kind) {
    const filePath = row.filePath;
    const number = row.number;

    if (!filePath || !fs.existsSync(filePath)) {
        throw new Error(`PDF introuvable pour ${number} : ${filePath}`);
    }

    const safeNumber = sanitizeFileName(number);
    const storagePath = `documents/${kind}/${safeNumber}.pdf`;

    if (IS_DRY_RUN) {
        return {
            pdfUrl: `DRY_RUN_URL/${storagePath}`,
            storagePath,
        };
    }
    const stats = fs.statSync(filePath);

    if (stats.size === 0) {
        throw new Error(`PDF vide : ${filePath}`);
    }
    await bucket.upload(filePath, {
        destination: storagePath,
        metadata: { contentType: "application/pdf" },
    });

    const file = bucket.file(storagePath);

    const [url] = await file.getSignedUrl({
        action: "read",
        expires: "03-01-2500",
    });

    return { pdfUrl: url, storagePath };
}

function buildPayload(row, kind, uploadResult, clientMatch) {
    const isProforma = kind === "archived-proformas";

    return {
        type: isProforma ? "proforma" : "invoice",
        number: cleanString(row.number) || "",

        clientId: clientMatch.clientId,
        clientName: clientMatch.clientName || "",
        historicalClientName: clientMatch.historicalClientName,
        clientMatchStatus: clientMatch.clientMatchStatus,
        matchType: cleanString(row.matchType),
        matchReason: cleanString(row.matchReason),

        designation: cleanString(row.designation),

        documentDate: isProforma
            ? excelDateToISO(row.documentDate)
            : excelDateToISO(row.invoiceDate),

        eventDate: excelDateToISO(row.eventDate),
        eventTime: cleanString(row.eventTime),

        invoiceDate: isProforma ? undefined : excelDateToISO(row.invoiceDate),
        paymentDate: isProforma ? undefined : excelDateToISO(row.paymentDate),

        amount: cleanAmount(row.amount),
        currency: "USD",

        linkedInvoiceNumber: isProforma ? cleanString(row.linkedInvoiceNumber) : undefined,
        linkedProformaNumber: undefined,

        fileName: cleanString(row.fileName) || "",
        pdfUrl: uploadResult.pdfUrl,
        storagePath: uploadResult.storagePath,

        source: "historical_import",
        importBatch: IS_TEST ? "pilot_5_archives" : "historical_archives_v4",
        importStatus: cleanString(row.importStatus) || "complete",
        auditVersion: "v4",

        metadataStatus:
            cleanString(row.designation) &&
                (isProforma
                    ? excelDateToISO(row.documentDate)
                    : excelDateToISO(row.invoiceDate))
                ? "complete"
                : "missing_info",

        isMetadataVerified: false,

        internalNote: "",

        metadataUpdatedAt: null,

        metadataUpdatedBy: null,
        metadataVersion: 1,

        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        importedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
}

function removeUndefined(payload) {
    Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) delete payload[key];
    });
    return payload;
}

async function alreadyExists(db, type, number) {
    const snap = await db
        .collection(COLLECTION_NAME)
        .where("type", "==", type)
        .where("number", "==", number)
        .limit(1)
        .get();

    return !snap.empty;
}
async function importRows({ db, bucket, rows, kind, clientsByName, clientMapping }) {

    let imported = 0;
    let skipped = 0;
    let errors = 0;
    let matched = 0;
    let unmatched = 0;

    for (const row of rows) {
        const number = cleanString(row.number);
        const type = kind === "archived-proformas" ? "proforma" : "invoice";

        if (!number) {
            skipped++;
            continue;
        }

        try {
            const exists = await alreadyExists(db, type, number);

            if (exists) {
                console.log(`⏭️ Déjà existant : ${type} ${number}`);
                skipped++;
                continue;
            }

            const clientMatch = findClientMatch(row, clientsByName, clientMapping);
            if (clientMatch.clientId) matched++;
            else unmatched++;

            console.log(
                `📄 ${type.toUpperCase()} | ${number} | ${row.clientExcel} | ${row.fileName}`
            );

            const uploadResult = await uploadPdf(bucket, row, kind);
            const payload = removeUndefined(buildPayload(row, kind, uploadResult, clientMatch));



            if (IS_DRY_RUN) {
                console.log(
                    "DRY RUN:",
                    type,
                    number,
                    "| client:",
                    payload.clientName,
                    "| match:",
                    payload.clientMatchStatus
                );
            } else {
                await db.collection(COLLECTION_NAME).add(payload);
                console.log(
                    `✅ Importé : ${type} ${number} | ${payload.clientName} | ${payload.clientMatchStatus}`
                );
            }

            imported++;
        } catch (error) {
            errors++;
            console.error(`❌ Erreur ${type} ${number}:`, error.message);
        }
    }

    return { imported, skipped, errors, matched, unmatched };
}

async function main() {
    console.log("===== IMPORT ARCHIVES HISTORIQUES JFKAPP =====");
    console.log("Mode test:", IS_TEST);
    console.log("Dry run:", IS_DRY_RUN);

    if (!fs.existsSync(EXCEL_PATH)) {
        throw new Error(`Excel introuvable : ${EXCEL_PATH}`);
    }

    const firebase = initFirebase();
    const db = firebase.firestore();

    const bucket = firebase
        .storage()
        .bucket(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET);

    console.log("Bucket utilisé:", bucket.name);

    const clients = await loadClientsMap(db);

    const clientsByName = buildClientsByName(clients);
    const clientMapping = loadClientMapping();

    const workbook = XLSX.readFile(EXCEL_PATH);

    let proformas = readSheet(workbook, "matched_proformas");
    let invoices = readSheet(workbook, "matched_invoices");

    if (IS_TEST) {
        proformas = proformas.slice(0, TEST_PROFORMA_LIMIT);
        invoices = invoices.slice(0, TEST_INVOICE_LIMIT);
    }

    console.log(`Proformas à traiter : ${proformas.length}`);
    console.log(`Factures à traiter : ${invoices.length}`);

    const proformaResult = await importRows({
        db,
        bucket,
        rows: proformas,
        kind: "archived-proformas",
        clientsByName,
        clientMapping,
    });

    const invoiceResult = await importRows({
        db,
        bucket,
        rows: invoices,
        kind: "archived-invoices",
        clientsByName,
        clientMapping,
    });

    console.log("===== RÉSUMÉ IMPORT =====");
    console.log("Proformas:", proformaResult);
    console.log("Factures:", invoiceResult);
    console.log("Total importé:", proformaResult.imported + invoiceResult.imported);
    console.log("Total ignoré:", proformaResult.skipped + invoiceResult.skipped);
    console.log("Total erreurs:", proformaResult.errors + invoiceResult.errors);
    console.log("Total matchés:", proformaResult.matched + invoiceResult.matched);
    console.log("Total non matchés:", proformaResult.unmatched + invoiceResult.unmatched);
}

main().catch((error) => {
    console.error("Erreur fatale:", error);
    process.exit(1);
});