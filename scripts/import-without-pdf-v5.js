require("dotenv").config({ path: ".env.test" });

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const INPUT =
    "B:/Professionnel/Creperie/Clientele/Archives_Crepolia/audit_import_archives_v4.xlsx";

const SERVICE_ACCOUNT = path.resolve("serviceAccountKey.json");
const COLLECTION = "archived_documents";

admin.initializeApp({
    credential: admin.credential.cert(require(SERVICE_ACCOUNT)),
});

const db = admin.firestore();

function clean(v) {
    const s = String(v || "").trim();
    return s || "";
}

function amount(v) {
    const n = Number(String(v || "").replace(",", ".").replace(/\s/g, ""));
    return Number.isFinite(n) ? n : undefined;
}

function excelDate(v) {
    if (!v) return undefined;
    if (typeof v === "string") return v.trim() || undefined;

    const d = XLSX.SSF.parse_date_code(v);
    if (!d) return undefined;

    return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
}

async function exists(type, number) {
    const snap = await db
        .collection(COLLECTION)
        .where("type", "==", type)
        .where("number", "==", number)
        .limit(1)
        .get();

    return !snap.empty;
}

async function main() {
    const wb = XLSX.readFile(INPUT);
    const rows = XLSX.utils.sheet_to_json(wb.Sheets["excel_without_pdf"], {
        defval: "",
    });

    let imported = 0;
    let skipped = 0;
    let failed = 0;

    for (const row of rows) {
        const type = clean(row.type);
        const number = clean(row.number);

        if (!type || !number) {
            skipped++;
            continue;
        }

        try {
            if (await exists(type, number)) {
                console.log("Déjà existant :", type, number);
                skipped++;
                continue;
            }

            const isInvoice = type === "invoice";

            await db.collection(COLLECTION).add({
                type,
                number,

                clientName: clean(row.clientExcel),
                historicalClientName: clean(row.clientExcel),
                clientMatchStatus: "unmapped",

                designation: clean(row.designation),

                documentDate: isInvoice
                    ? excelDate(row.invoiceDate || row.eventDate)
                    : excelDate(row.documentDate || row.eventDate),

                invoiceDate: isInvoice ? excelDate(row.invoiceDate) : undefined,
                eventDate: excelDate(row.eventDate),
                eventTime: clean(row.eventTime),

                amount: amount(row.amount),
                currency: "USD",

                fileName: "",
                pdfUrl: "",
                storagePath: "",

                source: "historical_import",
                importBatch: "without_pdf_v5",
                importStatus: "missing_pdf",

                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                importedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            console.log("Importé sans PDF :", type, number);
            imported++;
        } catch (e) {
            console.error("Erreur :", type, number, e.message);
            failed++;
        }
    }

    console.log("===== RÉSUMÉ =====");
    console.log({ total: rows.length, imported, skipped, failed });
}

main().catch(console.error);