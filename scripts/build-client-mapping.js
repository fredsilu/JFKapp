const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const EXCEL_PATH =
    "B:/Professionnel/Creperie/Clientele/Archives_Crepolia/audit_import_archives_v3.xlsx";

const OUTPUT_PATH =
    "B:/Professionnel/Creperie/Clientele/Archives_Crepolia/archive_client_mapping_v1.xlsx";

const SERVICE_ACCOUNT_PATH = path.resolve("serviceAccountKey.json");

const STOP_WORDS = [
    "sarl", "sarlu", "sprl", "sa", "ltd", "llc", "inc",
    "rdc", "drc", "kin", "kinshasa",
    "monsieur", "madame", "mr", "mme", "m", "dg", "dr", "ceo",
    "direction", "famille", "event", "evenement", "mariage",
];

const REPLACEMENTS = [
    ["citybank", "citibank"],
    ["citi bank", "citibank"],
    ["citi", "citibank"],
    ["raw bank", "rawbank"],
    ["rawbanksa", "rawbank"],
    ["unicefrdc", "unicef"],
    ["equity bank congo", "equitybcdc"],
    ["equity bcdc", "equitybcdc"],
];

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

function cleanString(value) {
    return String(value || "").trim();
}

function normalizeName(value) {
    let text = cleanString(value)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, " ")
        .replace(/[._\-\/]/g, " ")
        .replace(/[^a-z0-9 ]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    for (const [from, to] of REPLACEMENTS) {
        text = text.replaceAll(from, to);
    }

    const words = text
        .split(" ")
        .filter((word) => word && !STOP_WORDS.includes(word));

    return words.join("");
}

function cleanAmount(value) {
    if (value === "" || value === null || value === undefined) return 0;

    const amount = Number(
        String(value).replace(",", ".").replace(/\s/g, "").trim()
    );

    return Number.isFinite(amount) ? amount : 0;
}

function readSheet(workbook, sheetName) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) throw new Error(`Onglet introuvable : ${sheetName}`);
    return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

async function loadClients(db) {
    const snap = await db.collection("clients").get();

    return snap.docs
        .map((doc) => {
            const data = doc.data();
            const clientName = cleanString(data.name);

            return {
                clientId: doc.id,
                clientName,
                normalizedName: normalizeName(clientName),
            };
        })
        .filter((c) => c.clientName);
}

function getGroupKey(row) {
    const clientFolder = cleanString(row.clientFolder);
    const clientExcel = cleanString(row.clientExcel);

    const candidates = [clientFolder, clientExcel].filter(Boolean);

    for (const candidate of candidates) {
        const key = normalizeName(candidate);
        if (key) return key;
    }

    return "";
}

function buildHistoricalGroups(proformas, invoices) {
    const groups = new Map();

    function addRow(row, type) {
        const key = getGroupKey(row);
        if (!key) return;

        const clientExcel = cleanString(row.clientExcel);
        const clientFolder = cleanString(row.clientFolder);

        if (!groups.has(key)) {
            groups.set(key, {
                groupKey: key,
                historicalGroupName: clientFolder || clientExcel,
                aliases: new Set(),
                totalDocs: 0,
                proformas: 0,
                invoices: 0,
                totalAmount: 0,
            });
        }

        const group = groups.get(key);

        if (clientExcel) group.aliases.add(clientExcel);
        if (clientFolder) group.aliases.add(clientFolder);

        group.totalDocs += 1;
        if (type === "proforma") group.proformas += 1;
        if (type === "invoice") group.invoices += 1;

        group.totalAmount += cleanAmount(row.amount);
    }

    proformas.forEach((row) => addRow(row, "proforma"));
    invoices.forEach((row) => addRow(row, "invoice"));

    return Array.from(groups.values()).map((group) => ({
        ...group,
        aliases: Array.from(group.aliases).sort(),
    }));
}

function matchGroup(group, clients) {
    const candidates = [
        group.historicalGroupName,
        ...group.aliases,
    ].filter(Boolean);

    for (const candidate of candidates) {
        const normalized = normalizeName(candidate);

        const exact = clients.find((c) => c.clientName === candidate);
        if (exact) {
            return {
                suggestedClientName: exact.clientName,
                matchScore: 100,
                matchStatus: "AUTO_EXACT",
                matchedFrom: candidate,
            };
        }

        const normalizedMatch = clients.find((c) => c.normalizedName === normalized);
        if (normalizedMatch) {
            return {
                suggestedClientName: normalizedMatch.clientName,
                matchScore: 95,
                matchStatus: "AUTO_NORMALIZED",
                matchedFrom: candidate,
            };
        }

        const containsMatch = clients.find(
            (c) =>
                normalized.length >= 4 &&
                c.normalizedName.length >= 4 &&
                (c.normalizedName.includes(normalized) ||
                    normalized.includes(c.normalizedName))
        );

        if (containsMatch) {
            return {
                suggestedClientName: containsMatch.clientName,
                matchScore: 90,
                matchStatus: "AUTO_CONTAINS",
                matchedFrom: candidate,
            };
        }
    }

    return {
        suggestedClientName: "",
        matchScore: 0,
        matchStatus: "MANUAL",
        matchedFrom: "",
    };
}

function writeWorkbook(rows, clients) {
    const workbook = XLSX.utils.book_new();

    const mappingRows = rows.map((row) => ({
        historicalGroupName: row.historicalGroupName,
        aliases: row.aliases.join(" | "),
        totalDocs: row.totalDocs,
        proformas: row.proformas,
        invoices: row.invoices,
        totalAmount: row.totalAmount,
        suggestedClientName: row.suggestedClientName,
        matchScore: row.matchScore,
        matchStatus: row.matchStatus,
        matchedFrom: row.matchedFrom,

        // Seule colonne à corriger manuellement
        finalClientName: row.suggestedClientName,

        notes: "",
    }));

    const clientsAppRows = clients
        .map((c) => ({ clientName: c.clientName }))
        .sort((a, b) => a.clientName.localeCompare(b.clientName));

    const summary = [
        { indicateur: "Clients historiques groupés", valeur: rows.length },
        { indicateur: "AUTO_EXACT", valeur: rows.filter((r) => r.matchStatus === "AUTO_EXACT").length },
        { indicateur: "AUTO_NORMALIZED", valeur: rows.filter((r) => r.matchStatus === "AUTO_NORMALIZED").length },
        { indicateur: "AUTO_CONTAINS", valeur: rows.filter((r) => r.matchStatus === "AUTO_CONTAINS").length },
        { indicateur: "MANUAL", valeur: rows.filter((r) => r.matchStatus === "MANUAL").length },
        { indicateur: "Documents couverts", valeur: rows.reduce((sum, r) => sum + r.totalDocs, 0) },
    ];

    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summary), "summary");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(mappingRows), "client_mapping");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(clientsAppRows), "clients_app");

    XLSX.writeFile(workbook, OUTPUT_PATH);
}

async function main() {
    console.log("===== BUILD CLIENT MAPPING JFKAPP V2 =====");

    if (!fs.existsSync(EXCEL_PATH)) {
        throw new Error(`Excel introuvable : ${EXCEL_PATH}`);
    }

    const firebase = initFirebase();
    const db = firebase.firestore();

    const workbook = XLSX.readFile(EXCEL_PATH);
    const proformas = readSheet(workbook, "matched_proformas");
    const invoices = readSheet(workbook, "matched_invoices");

    const clients = await loadClients(db);
    console.log(`Clients app chargés : ${clients.length}`);

    const groups = buildHistoricalGroups(proformas, invoices);
    console.log(`Clients historiques groupés : ${groups.length}`);

    const mappedRows = groups
        .map((group) => ({
            ...group,
            ...matchGroup(group, clients),
        }))
        .sort((a, b) => {
            if (a.matchStatus === "MANUAL" && b.matchStatus !== "MANUAL") return -1;
            if (a.matchStatus !== "MANUAL" && b.matchStatus === "MANUAL") return 1;
            return b.totalDocs - a.totalDocs;
        });

    writeWorkbook(mappedRows, clients);

    console.log("Mapping généré :");
    console.log(OUTPUT_PATH);
    console.log("AUTO_EXACT:", mappedRows.filter((r) => r.matchStatus === "AUTO_EXACT").length);
    console.log("AUTO_NORMALIZED:", mappedRows.filter((r) => r.matchStatus === "AUTO_NORMALIZED").length);
    console.log("AUTO_CONTAINS:", mappedRows.filter((r) => r.matchStatus === "AUTO_CONTAINS").length);
    console.log("MANUAL:", mappedRows.filter((r) => r.matchStatus === "MANUAL").length);
}

main().catch((error) => {
    console.error("Erreur fatale:", error);
    process.exit(1);
});