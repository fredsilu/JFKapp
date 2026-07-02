// scripts/audit_import_archives_v4.js
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const EXCEL_PATH =
    "B:/Professionnel/Creperie/Clientele/Numero factures clients.xlsx";

const ARCHIVES_ROOT_DIR = "B:/Professionnel/Creperie/Clientele";

const OUTPUT_PATH =
    "B:/Professionnel/Creperie/Clientele/Archives_Crepolia/audit_import_archives_v4.xlsx";

const EXCLUDED_DIR_NAMES = ["Archives_Crepolia", "node_modules", ".git"];

function normalize(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\.[^.]+$/i, "")
        .replace(/\s+/g, "_")
        .replace(/-/g, "_")
        .replace(/\./g, "_")
        .replace(/_+/g, "_");
}

function normalizeColumnName(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function normalizeRow(row) {
    const normalized = {};

    for (const key of Object.keys(row)) {
        normalized[normalizeColumnName(key)] = row[key];
    }

    return normalized;
}

function isValidValue(value) {
    const v = String(value || "").trim().toLowerCase();
    return v && v !== "x" && v !== "n/a" && v !== "na" && v !== "-";
}

function getValue(row, possibleNames) {
    const normalizedRow = normalizeRow(row);

    for (const name of possibleNames) {
        const key = normalizeColumnName(name);

        if (
            normalizedRow[key] !== undefined &&
            normalizedRow[key] !== null &&
            normalizedRow[key] !== ""
        ) {
            return normalizedRow[key];
        }
    }

    return "";
}

function getFileKind(fileName) {
    const ext = path.extname(fileName).toLowerCase();

    if (ext === ".pdf") return "pdf";
    if (ext === ".docx" || ext === ".doc") return "source_word";
    if (ext === ".xlsx" || ext === ".xls") return "source_excel";

    return "other";
}

function getDocumentType(fileName) {
    const lower = fileName.toLowerCase();

    if (
        lower.startsWith("facture_") ||
        lower.startsWith("facture ") ||
        lower.includes("_fc_") ||
        lower.includes("-fc-")
    ) {
        return "invoice";
    }

    if (
        lower.startsWith("proforma_") ||
        lower.startsWith("proforma ") ||
        lower.includes("_pr_") ||
        lower.includes("-pr-") ||
        lower.includes("_pf_") ||
        lower.includes("-pf-")
    ) {
        return "proforma";
    }

    return "unknown";
}

function extractDocumentNumber(value, forcedType) {
    const raw = String(value || "").trim();
    if (!raw) return "";

    const normalized = normalize(raw);

    let match = normalized.match(/cr_?(\d{4})_?(fc|pf|pr)_?0*(\d+)/);

    if (match) {
        const year = match[1];
        const prefix = match[2] === "pr" ? "pf" : match[2];
        const sequence = String(Number(match[3])).padStart(3, "0");

        return `cr${year}_${prefix}_${sequence}`;
    }

    match = normalized.match(/cr_?(\d{4})_?0*(\d+)/);

    if (match && forcedType === "proforma") {
        const year = match[1];
        const sequence = String(Number(match[2])).padStart(3, "0");

        return `cr${year}_pf_${sequence}`;
    }

    return "";
}

function getMatchQuality(excelNumber, fileName) {
    const excelNormalized = normalize(excelNumber);
    const fileNormalized = normalize(fileName);

    const excelExtracted = extractDocumentNumber(excelNumber);
    const fileExtracted = extractDocumentNumber(fileName);

    if (!excelExtracted || !fileExtracted) {
        return {
            matched: false,
            reason: "Numéro métier non extrait",
            matchType: "none",
        };
    }

    if (excelNormalized && fileNormalized.includes(excelNormalized)) {
        return {
            matched: true,
            reason: "Correspondance directe",
            matchType: "direct",
        };
    }

    if (excelExtracted === fileExtracted) {
        return {
            matched: true,
            reason: "Correspondance corrigée automatiquement",
            matchType: "auto_fixed",
        };
    }

    return {
        matched: false,
        reason: "Numéros différents",
        matchType: "none",
    };
}

function shouldSkipDirectory(dirPath) {
    const dirName = path.basename(dirPath);

    return EXCLUDED_DIR_NAMES.some(
        (excluded) => excluded.toLowerCase() === dirName.toLowerCase()
    );
}

function scanArchiveFiles(dir, results = []) {
    if (!fs.existsSync(dir)) {
        throw new Error(`Dossier introuvable : ${dir}`);
    }

    if (shouldSkipDirectory(dir)) {
        return results;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            scanArchiveFiles(fullPath, results);
            continue;
        }

        if (!entry.isFile()) continue;

        const fileKind = getFileKind(entry.name);

        if (!["pdf", "source_word", "source_excel"].includes(fileKind)) continue;

        const detectedType = getDocumentType(entry.name);
        const documentNumber = extractDocumentNumber(entry.name, detectedType);

        const documentType =
            detectedType !== "unknown"
                ? detectedType
                : documentNumber.includes("_fc_")
                    ? "invoice"
                    : documentNumber.includes("_pf_")
                        ? "proforma"
                        : "unknown";

        results.push({
            fileName: entry.name,
            filePath: fullPath,
            clientFolder: path.basename(path.dirname(fullPath)),
            normalizedFileName: normalize(entry.name),
            extractedDocumentNumber: documentNumber,
            documentType,
            fileKind,
        });
    }

    return results;
}

function readSheet(workbook, sheetName) {
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
        console.warn(`Onglet introuvable : ${sheetName}`);
        return [];
    }

    return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

function findMatches(files, documentType, number) {
    const excelDocumentNumber = extractDocumentNumber(number, documentType);

    return files
        .filter((file) => {
            if (file.documentType !== documentType) return false;
            if (!excelDocumentNumber) return false;

            return file.extractedDocumentNumber === excelDocumentNumber;
        })
        .map((file) => {
            const quality = getMatchQuality(number, file.fileName);

            return {
                ...file,
                matchType: quality.matchType,
                matchReason: quality.reason,
            };
        });
}

function splitMatchesByKind(matches) {
    return {
        pdfs: matches.filter((m) => m.fileKind === "pdf"),
        sources: matches.filter((m) => m.fileKind !== "pdf"),
    };
}

function markFilesAsHandled(files, handledPaths) {
    for (const file of files) {
        handledPaths.add(file.filePath);
    }
}

function appendWorksheet(workbook, data, sheetName) {
    const safeData = data.length > 0 ? data : [{ info: "Aucune donnée" }];

    XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(safeData),
        sheetName
    );
}

function buildProformaRecord(row, pdf, number) {
    return {
        type: "proforma",
        number,
        normalizedNumber: extractDocumentNumber(number),
        clientExcel: getValue(row, ["Client"]),
        clientFolder: pdf.clientFolder,
        fileName: pdf.fileName,
        filePath: pdf.filePath,
        documentDate: getValue(row, ["Date"]),
        eventDate: getValue(row, ["Date evenem", "Date evenement"]),
        eventTime: getValue(row, ["Heure even", "Heure evenement", "Heure"]),
        designation: getValue(row, ["Designation", "Désignation"]),
        amount: getValue(row, ["Montant", "Montant proforma", "Total", "TOTAL"]),
        linkedInvoiceNumber: getValue(row, [
            "Num facture",
            "Numero facture",
            "N° facture",
            "Facture",
        ]),
        matchType: pdf.matchType,
        matchReason: pdf.matchReason,
        importStatus: "complete",
    };
}

function buildInvoiceRecord(row, pdf, number) {
    return {
        type: "invoice",
        number,
        normalizedNumber: extractDocumentNumber(number),
        clientExcel: getValue(row, ["Client"]),
        clientFolder: pdf.clientFolder,
        fileName: pdf.fileName,
        filePath: pdf.filePath,
        eventDate: getValue(row, ["Date evenement", "Date evenem"]),
        eventTime: getValue(row, ["Heure", "Heure evenement"]),
        designation: getValue(row, ["Designation", "Désignation"]),
        amount: getValue(row, [
            "Montant",
            "Montant facture",
            "Montant Facture",
            "Total",
            "TOTAL",
        ]),
        invoiceDate: getValue(row, [
            "Date de facture",
            "Date facture",
            "Date Facture",
        ]),
        paymentDate: getValue(row, [
            "Date de paiement",
            "Date paiement",
            "Paiement",
        ]),
        matchType: pdf.matchType,
        matchReason: pdf.matchReason,
        importStatus: "complete",
    };
}

function main() {
    console.log("Lecture Excel...");

    if (!fs.existsSync(EXCEL_PATH)) {
        throw new Error(`Fichier Excel introuvable : ${EXCEL_PATH}`);
    }

    const workbook = XLSX.readFile(EXCEL_PATH);

    const proformas = readSheet(workbook, "Proforma");
    const invoices = readSheet(workbook, "Factures");

    console.log(`Lignes Proforma Excel : ${proformas.length}`);
    console.log(`Lignes Factures Excel : ${invoices.length}`);

    console.log("Scan des fichiers PDF / sources...");
    const archiveFiles = scanArchiveFiles(ARCHIVES_ROOT_DIR);

    const usableFiles = archiveFiles.filter((f) => f.documentType !== "unknown");
    const unknownFiles = archiveFiles.filter((f) => f.documentType === "unknown");

    const pdfFiles = usableFiles.filter((f) => f.fileKind === "pdf");
    const sourceFiles = usableFiles.filter((f) => f.fileKind !== "pdf");

    console.log(`PDF facture/proforma détectés : ${pdfFiles.length}`);
    console.log(`Sources facture/proforma détectées : ${sourceFiles.length}`);
    console.log(`Fichiers inconnus ignorés : ${unknownFiles.length}`);

    const matchedProformas = [];
    const matchedInvoices = [];
    const excelWithoutPdf = [];
    const filesWithoutExcel = [];
    const duplicates = [];
    const autoFixedMatches = [];

    const handledFilePaths = new Set();

    for (const row of proformas) {
        const number = getValue(row, ["Numéro", "Numero", "N°", "No"]);

        if (!isValidValue(number)) continue;

        const matches = findMatches(usableFiles, "proforma", number);
        const { pdfs, sources } = splitMatchesByKind(matches);

        if (pdfs.length === 1) {
            const pdf = pdfs[0];

            matchedProformas.push(buildProformaRecord(row, pdf, number));

            if (pdf.matchType === "auto_fixed") {
                autoFixedMatches.push({
                    type: "proforma",
                    excelNumber: number,
                    normalizedNumber: extractDocumentNumber(number),
                    fileName: pdf.fileName,
                    filePath: pdf.filePath,
                    reason: pdf.matchReason,
                });
            }

            markFilesAsHandled([pdf, ...sources], handledFilePaths);
        } else if (pdfs.length === 0 && sources.length > 0) {
            excelWithoutPdf.push({
                type: "proforma",
                number,
                normalizedNumber: extractDocumentNumber(number),
                clientExcel: getValue(row, ["Client"]),
                reason: "Source trouvée mais PDF absent",
                sourceFiles: sources.map((s) => s.filePath).join(" | "),
                importStatus: "source_only",
            });

            markFilesAsHandled(sources, handledFilePaths);
        } else if (pdfs.length === 0) {
            excelWithoutPdf.push({
                type: "proforma",
                number,
                normalizedNumber: extractDocumentNumber(number),
                clientExcel: getValue(row, ["Client"]),
                reason: "Aucun PDF ni source trouvé",
                importStatus: "missing_file",
            });
        } else {
            duplicates.push({
                type: "proforma",
                number,
                normalizedNumber: extractDocumentNumber(number),
                clientExcel: getValue(row, ["Client"]),
                pdfCount: pdfs.length,
                sourceCount: sources.length,
                pdfFiles: pdfs.map((m) => m.filePath).join(" | "),
                sourceFiles: sources.map((m) => m.filePath).join(" | "),
                reason: "Plusieurs PDF trouvés pour la même proforma",
            });

            markFilesAsHandled([...pdfs, ...sources], handledFilePaths);
        }
    }

    for (const row of invoices) {
        const number = getValue(row, [
            "Factures",
            "Facture",
            "Num facture",
            "Numero facture",
            "N° facture",
        ]);

        if (!isValidValue(number)) continue;

        const matches = findMatches(usableFiles, "invoice", number);
        const { pdfs, sources } = splitMatchesByKind(matches);

        if (pdfs.length === 1) {
            const pdf = pdfs[0];

            matchedInvoices.push(buildInvoiceRecord(row, pdf, number));

            if (pdf.matchType === "auto_fixed") {
                autoFixedMatches.push({
                    type: "invoice",
                    excelNumber: number,
                    normalizedNumber: extractDocumentNumber(number),
                    fileName: pdf.fileName,
                    filePath: pdf.filePath,
                    reason: pdf.matchReason,
                });
            }

            markFilesAsHandled([pdf, ...sources], handledFilePaths);
        } else if (pdfs.length === 0 && sources.length > 0) {
            excelWithoutPdf.push({
                type: "invoice",
                number,
                normalizedNumber: extractDocumentNumber(number),
                clientExcel: getValue(row, ["Client"]),
                reason: "Source trouvée mais PDF absent",
                sourceFiles: sources.map((s) => s.filePath).join(" | "),
                importStatus: "source_only",
            });

            markFilesAsHandled(sources, handledFilePaths);
        } else if (pdfs.length === 0) {
            excelWithoutPdf.push({
                type: "invoice",
                number,
                normalizedNumber: extractDocumentNumber(number),
                clientExcel: getValue(row, ["Client"]),
                reason: "Aucun PDF ni source trouvé",
                importStatus: "missing_file",
            });
        } else {
            duplicates.push({
                type: "invoice",
                number,
                normalizedNumber: extractDocumentNumber(number),
                clientExcel: getValue(row, ["Client"]),
                pdfCount: pdfs.length,
                sourceCount: sources.length,
                pdfFiles: pdfs.map((m) => m.filePath).join(" | "),
                sourceFiles: sources.map((m) => m.filePath).join(" | "),
                reason: "Plusieurs PDF trouvés pour la même facture",
            });

            markFilesAsHandled([...pdfs, ...sources], handledFilePaths);
        }
    }

    for (const file of usableFiles) {
        if (handledFilePaths.has(file.filePath)) continue;

        filesWithoutExcel.push({
            type: file.documentType,
            fileKind: file.fileKind,
            clientFolder: file.clientFolder,
            fileName: file.fileName,
            filePath: file.filePath,
            extractedDocumentNumber: file.extractedDocumentNumber,
            reason:
                file.fileKind === "pdf"
                    ? "PDF facture/proforma non lié à Excel"
                    : "Source facture/proforma non liée à Excel",
        });
    }

    const directMatches =
        matchedProformas.filter((m) => m.matchType === "direct").length +
        matchedInvoices.filter((m) => m.matchType === "direct").length;

    const fixedMatches = autoFixedMatches.length;

    const outputWorkbook = XLSX.utils.book_new();

    const summary = [
        { indicateur: "Lignes Proforma Excel", valeur: proformas.length },
        { indicateur: "Lignes Factures Excel", valeur: invoices.length },
        { indicateur: "Fichiers utiles détectés", valeur: usableFiles.length },
        { indicateur: "PDF facture/proforma détectés", valeur: pdfFiles.length },
        { indicateur: "Sources facture/proforma détectées", valeur: sourceFiles.length },
        { indicateur: "Fichiers inconnus ignorés", valeur: unknownFiles.length },
        { indicateur: "Proformas matchées PDF", valeur: matchedProformas.length },
        { indicateur: "Factures matchées PDF", valeur: matchedInvoices.length },
        { indicateur: "Correspondances directes", valeur: directMatches },
        { indicateur: "Correspondances corrigées automatiquement", valeur: fixedMatches },
        { indicateur: "Excel sans PDF", valeur: excelWithoutPdf.length },
        { indicateur: "Fichiers utiles sans Excel", valeur: filesWithoutExcel.length },
        { indicateur: "Doublons", valeur: duplicates.length },
    ];

    appendWorksheet(outputWorkbook, summary, "summary");
    appendWorksheet(outputWorkbook, matchedProformas, "matched_proformas");
    appendWorksheet(outputWorkbook, matchedInvoices, "matched_invoices");
    appendWorksheet(outputWorkbook, autoFixedMatches, "auto_fixed_matches");
    appendWorksheet(outputWorkbook, excelWithoutPdf, "excel_without_pdf");
    appendWorksheet(outputWorkbook, filesWithoutExcel, "files_without_excel");
    appendWorksheet(outputWorkbook, duplicates, "duplicates");
    appendWorksheet(outputWorkbook, unknownFiles, "unknown_files_ignored");

    const outputDir = path.dirname(OUTPUT_PATH);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    XLSX.writeFile(outputWorkbook, OUTPUT_PATH);

    console.log("Audit v4 terminé.");
    console.log(`Proformas matchées PDF : ${matchedProformas.length}`);
    console.log(`Factures matchées PDF : ${matchedInvoices.length}`);
    console.log(`Correspondances directes : ${directMatches}`);
    console.log(`Correspondances corrigées automatiquement : ${fixedMatches}`);
    console.log(`Excel sans PDF : ${excelWithoutPdf.length}`);
    console.log(`Fichiers utiles sans Excel : ${filesWithoutExcel.length}`);
    console.log(`Doublons : ${duplicates.length}`);
    console.log(`Fichiers inconnus ignorés : ${unknownFiles.length}`);
    console.log(`Rapport généré : ${OUTPUT_PATH}`);
}

main();