require("dotenv").config({
    path: ".env.production",
});

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

/* ============================================================
   CONFIGURATION
============================================================ */

/**
 * Classeur métier principal.
 * Il contient notamment les feuilles :
 * - Factures
 * - Proforma
 */
const SOURCE_EXCEL_PATH =
    "B:/Professionnel/Creperie/Clientele/Numero factures clients.xlsx";

/**
 * Répertoire racine dans lequel les PDF métiers sont recherchés.
 *
 * La recherche sera récursive dans tous les sous-répertoires :
 * - idantiti
 * - equity
 * - unicef
 * - etc.
 */
const PDF_ROOT =
    "B:/Professionnel/Creperie/Clientele";

/**
 * Répertoire réservé aux fichiers produits par les scripts.
 * Il ne doit pas être analysé comme une source de PDF.
 */
const OUTPUT_DIRECTORY =
    "B:/Professionnel/Creperie/Clientele/Archives_Crepolia";

/**
 * Rapport Excel généré.
 */
const OUTPUT_PATH = path.join(
    OUTPUT_DIRECTORY,
    "diagnostic_documents_manquants_v2.xlsx"
);

const SERVICE_ACCOUNT_PATH =
    path.resolve("serviceAccountKey.json");

const COLLECTION_NAME =
    "archived_documents";

/**
 * Configuration des feuilles Excel et des types Firestore.
 */
const DOCUMENT_CONFIGS = [
    {
        label: "Factures",
        firestoreType: "invoice",
        excelSheet: "Factures",

        numberColumns: [
            "Factures",
            "Facture",
            "factures",
            "facture",
            "number",
            "Number",
            "numero",
            "Numéro",
            "invoiceNumber",
        ],

        clientColumns: [
            "Client",
            "client",
            "clientExcel",
            "clientName",
        ],

        amountColumns: [
            "Montant",
            "montant",
            "Amount",
            "amount",
            "Total",
            "total",
        ],

        dateColumns: [
            "Date",
            "date",
            "Date facture",
            "dateFacture",
            "invoiceDate",
        ],
    },

    {
        label: "Proformas",
        firestoreType: "proforma",
        excelSheet: "Proforma",

        numberColumns: [
            "Proforma",
            "Proformas",
            "proforma",
            "proformas",
            "number",
            "Number",
            "numero",
            "Numéro",
            "proformaNumber",
        ],

        clientColumns: [
            "Client",
            "client",
            "clientExcel",
            "clientName",
        ],

        amountColumns: [
            "Montant",
            "montant",
            "Amount",
            "amount",
            "Total",
            "total",
        ],

        dateColumns: [
            "Date",
            "date",
            "Date proforma",
            "dateProforma",
            "documentDate",
        ],
    },
];

/* ============================================================
   INITIALISATION FIREBASE
============================================================ */

function initFirebase() {
    if (admin.apps.length > 0) {
        return admin;
    }

    if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
        throw new Error(
            `serviceAccountKey.json introuvable : ${SERVICE_ACCOUNT_PATH}`
        );
    }

    const serviceAccount =
        require(SERVICE_ACCOUNT_PATH);

    admin.initializeApp({
        credential:
            admin.credential.cert(serviceAccount),
    });

    return admin;
}

/* ============================================================
   UTILITAIRES GÉNÉRAUX
============================================================ */

function cleanText(value) {
    return String(value ?? "").trim();
}

function firstNonEmpty(
    object,
    fieldNames
) {
    for (const fieldName of fieldNames) {
        const value =
            object?.[fieldName];

        if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
        ) {
            return value;
        }
    }

    return "";
}

function normalizeClientName(value) {
    return cleanText(value)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "")
        .trim();
}

function normalizeAmount(value) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    if (typeof value === "number") {
        return Number.isFinite(value)
            ? value
            : null;
    }

    let text = String(value)
        .trim()
        .replace(/\s/g, "")
        .replace(/[^\d,.-]/g, "");

    if (!text) {
        return null;
    }

    const lastComma =
        text.lastIndexOf(",");

    const lastDot =
        text.lastIndexOf(".");

    if (
        lastComma !== -1 &&
        lastDot !== -1
    ) {
        if (lastComma > lastDot) {
            text = text
                .replace(/\./g, "")
                .replace(",", ".");
        } else {
            text = text.replace(/,/g, "");
        }
    } else if (lastComma !== -1) {
        text = text.replace(",", ".");
    }

    const parsed =
        Number(text);

    return Number.isFinite(parsed)
        ? parsed
        : null;
}

function normalizeDate(value) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return "";
    }

    if (
        value &&
        typeof value.toDate === "function"
    ) {
        return normalizeDate(
            value.toDate()
        );
    }

    if (
        value instanceof Date &&
        !Number.isNaN(value.getTime())
    ) {
        return value
            .toISOString()
            .slice(0, 10);
    }

    if (typeof value === "number") {
        const parsed =
            XLSX.SSF.parse_date_code(value);

        if (!parsed) {
            return "";
        }

        return (
            `${parsed.y}-` +
            `${String(parsed.m).padStart(2, "0")}-` +
            `${String(parsed.d).padStart(2, "0")}`
        );
    }

    const text =
        String(value).trim();

    if (!text) {
        return "";
    }

    const frenchDate =
        text.match(
            /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/
        );

    if (frenchDate) {
        return (
            `${frenchDate[3]}-` +
            `${String(frenchDate[2]).padStart(2, "0")}-` +
            `${String(frenchDate[1]).padStart(2, "0")}`
        );
    }

    const isoDate =
        text.match(
            /^(\d{4})-(\d{1,2})-(\d{1,2})/
        );

    if (isoDate) {
        return (
            `${isoDate[1]}-` +
            `${String(isoDate[2]).padStart(2, "0")}-` +
            `${String(isoDate[3]).padStart(2, "0")}`
        );
    }

    return text;
}

/* ============================================================
   NORMALISATION DES NUMÉROS
============================================================ */

/**
 * Retire l’extension et normalise les caractères.
 */
function prepareDocumentText(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\.(pdf|xlsx|xls)$/i, "")
        .trim();
}

/**
 * Normalisation des factures.
 *
 * Ces valeurs deviennent identiques :
 *
 * facture_CR2026_FC_49
 * facture_CR2026_FC_049
 * facture_CR2026-FC-049.pdf
 *
 * Résultat :
 *
 * facture_cr2026_fc_049
 */
function normalizeInvoiceNumber(value) {
    let text =
        prepareDocumentText(value);

    if (!text) {
        return "";
    }

    text = text
        .replace(/^facture[\s_-]*/i, "")
        .replace(/[\s\-./\\]+/g, "_")
        .replace(/[^a-z0-9_]/g, "")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");

    const match =
        text.match(
            /^cr(\d{4})_fc_(\d+)([a-z]*)$/
        );

    if (!match) {
        return text
            ? `facture_${text}`
            : "";
    }

    const year =
        match[1];

    const sequence =
        match[2].padStart(3, "0");

    const suffix =
        match[3] ?? "";

    return (
        `facture_cr${year}_fc_` +
        `${sequence}${suffix}`
    );
}

/**
 * Normalisation des proformas.
 *
 * Ces valeurs deviennent identiques :
 *
 * CR2025-061
 * proforma_CR2025-061.pdf
 * proforma_crepoliaCR2025-061.pdf
 * proforma-crepolia-CR2025-061.pdf
 *
 * Résultat :
 *
 * cr2025_061
 */
function normalizeProformaNumber(value) {
    let text =
        prepareDocumentText(value);

    if (!text) {
        return "";
    }

    text = text
        .replace(
            /^proforma[\s_-]*crepolia[\s_-]*/i,
            ""
        )
        .replace(
            /^proforma[\s_-]*/i,
            ""
        )
        .replace(/[\s\-./\\]+/g, "_")
        .replace(/[^a-z0-9_]/g, "")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");

    /**
     * Exemple :
     *
     * CR2021-081_p15
     * devient cr2021_081_p015
     */
    const pageMatch =
        text.match(
            /^cr(\d{4})_(\d+)_p(\d+)$/
        );

    if (pageMatch) {
        const year =
            pageMatch[1];

        const sequence =
            pageMatch[2].padStart(3, "0");

        const page =
            pageMatch[3].padStart(3, "0");

        return (
            `cr${year}_${sequence}_p${page}`
        );
    }

    /**
     * Exemple :
     *
     * CR2021-082-1
     * devient cr2021_082_001
     */
    const subNumberMatch =
        text.match(
            /^cr(\d{4})_(\d+)_(\d+)$/
        );

    if (subNumberMatch) {
        const year =
            subNumberMatch[1];

        const sequence =
            subNumberMatch[2]
                .padStart(3, "0");

        const subNumber =
            subNumberMatch[3]
                .padStart(3, "0");

        return (
            `cr${year}_${sequence}_${subNumber}`
        );
    }

    /**
     * Exemple :
     *
     * CR2025-061
     * devient cr2025_061
     */
    const standardMatch =
        text.match(
            /^cr(\d{4})_(\d+)([a-z]*)$/
        );

    if (standardMatch) {
        const year =
            standardMatch[1];

        const sequence =
            standardMatch[2]
                .padStart(3, "0");

        const suffix =
            standardMatch[3] ?? "";

        return (
            `cr${year}_${sequence}${suffix}`
        );
    }

    return text;
}

function normalizeDocumentNumber(
    value,
    documentType
) {
    if (documentType === "invoice") {
        return normalizeInvoiceNumber(value);
    }

    if (documentType === "proforma") {
        return normalizeProformaNumber(value);
    }

    return prepareDocumentText(value)
        .replace(/[\s\-./\\]+/g, "_")
        .replace(/[^a-z0-9_]/g, "")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");
}

/* ============================================================
   INDEXATION
============================================================ */

function addToIndex(
    index,
    key,
    value
) {
    if (!key) {
        return;
    }

    if (!index.has(key)) {
        index.set(key, []);
    }

    index.get(key).push(value);
}

function uniqueByPath(files) {
    const map = new Map();

    for (const file of files) {
        map.set(
            file.filePath,
            file
        );
    }

    return Array.from(
        map.values()
    );
}

/* ============================================================
   LECTURE DES DOCUMENTS EXCEL
============================================================ */

function readExcelDocuments(
    workbook,
    config
) {
    const worksheet =
        workbook.Sheets[
        config.excelSheet
        ];

    if (!worksheet) {
        throw new Error(
            `Feuille "${config.excelSheet}" introuvable. ` +
            `Feuilles disponibles : ${workbook.SheetNames.join(", ")}`
        );
    }

    const rawRows =
        XLSX.utils.sheet_to_json(
            worksheet,
            {
                defval: "",
                raw: true,
            }
        );

    const documents =
        rawRows
            .map((row, index) => {
                const rawNumber =
                    firstNonEmpty(
                        row,
                        config.numberColumns
                    );

                const rawClient =
                    firstNonEmpty(
                        row,
                        config.clientColumns
                    );

                const rawAmount =
                    firstNonEmpty(
                        row,
                        config.amountColumns
                    );

                const rawDate =
                    firstNonEmpty(
                        row,
                        config.dateColumns
                    );

                const normalizedNumber =
                    normalizeDocumentNumber(
                        rawNumber,
                        config.firestoreType
                    );

                return {
                    excelRow:
                        index + 2,

                    documentCategory:
                        config.label,

                    expectedFirestoreType:
                        config.firestoreType,

                    numberExcel:
                        cleanText(rawNumber),

                    normalizedNumber,

                    clientExcel:
                        cleanText(rawClient),

                    normalizedClient:
                        normalizeClientName(
                            rawClient
                        ),

                    amountExcel:
                        normalizeAmount(
                            rawAmount
                        ),

                    dateExcel:
                        normalizeDate(
                            rawDate
                        ),

                    rawRow:
                        row,
                };
            })
            .filter(
                (document) =>
                    document.normalizedNumber
            );

    return {
        rawRowCount:
            rawRows.length,

        documentCount:
            documents.length,

        documents,
    };
}

/* ============================================================
   LECTURE DE FIRESTORE
============================================================ */

async function loadFirestoreDocuments(
    db
) {
    const snapshot = await db
        .collection(
            COLLECTION_NAME
        )
        .get();

    return snapshot.docs
        .map((documentSnapshot) => {
            const data =
                documentSnapshot.data();

            const firestoreType =
                cleanText(
                    data.type
                );

            const rawNumber =
                firstNonEmpty(
                    data,
                    [
                        "number",
                        "invoiceNumber",
                        "proformaNumber",
                        "documentNumber",
                        "numero",
                    ]
                );

            const normalizedNumber =
                normalizeDocumentNumber(
                    rawNumber,
                    firestoreType
                );

            const amount =
                data.amount ??
                data.total ??
                data.grandTotal ??
                data.totals?.total;

            const documentDate =
                data.invoiceDate ??
                data.documentDate ??
                data.eventDate ??
                data.issuedAt;

            return {
                firestoreId:
                    documentSnapshot.id,

                firestoreType,

                numberFirestore:
                    cleanText(
                        rawNumber
                    ),

                normalizedNumber,

                clientFirestore:
                    cleanText(
                        data.clientName
                    ),

                normalizedClient:
                    normalizeClientName(
                        data.clientName
                    ),

                amountFirestore:
                    normalizeAmount(
                        amount
                    ),

                dateFirestore:
                    normalizeDate(
                        documentDate
                    ),

                fileNameFirestore:
                    cleanText(
                        data.fileName
                    ),

                storagePath:
                    cleanText(
                        data.storagePath ??
                        data.pdfPath ??
                        data.filePath
                    ),

                pdfUrl:
                    cleanText(
                        data.pdfUrl
                    ),

                importBatch:
                    cleanText(
                        data.importBatch
                    ),

                source:
                    cleanText(
                        data.source
                    ),

                rawData:
                    data,
            };
        })
        .filter(
            (document) =>
                document.normalizedNumber
        );
}

/* ============================================================
   INDEXATION FIRESTORE
============================================================ */

function buildFirestoreIndexes(
    firestoreDocuments
) {
    const byNormalizedNumber =
        new Map();

    const byTypeAndNumber =
        new Map();

    const byFileName =
        new Map();

    for (
        const document
        of firestoreDocuments
    ) {
        addToIndex(
            byNormalizedNumber,
            document.normalizedNumber,
            document
        );

        const typeAndNumberKey =
            `${document.firestoreType}::${document.normalizedNumber}`;

        addToIndex(
            byTypeAndNumber,
            typeAndNumberKey,
            document
        );

        if (
            document.fileNameFirestore
        ) {
            const normalizedFileName =
                normalizeDocumentNumber(
                    document.fileNameFirestore,
                    document.firestoreType
                );

            addToIndex(
                byFileName,
                normalizedFileName,
                document
            );
        }
    }

    return {
        byNormalizedNumber,
        byTypeAndNumber,
        byFileName,
    };
}

/* ============================================================
   INDEXATION EXCEL
============================================================ */

function buildExcelIndexes(
    excelDocuments
) {
    const byNormalizedNumber =
        new Map();

    for (
        const document
        of excelDocuments
    ) {
        addToIndex(
            byNormalizedNumber,
            document.normalizedNumber,
            document
        );
    }

    return {
        byNormalizedNumber,
    };
}

/* ============================================================
   DÉTECTION DES DOUBLONS EXCEL
============================================================ */

function buildExcelDuplicates(
    excelDocuments
) {
    const index =
        buildExcelIndexes(
            excelDocuments
        );

    const duplicates = [];

    for (
        const [
            normalizedNumber,
            rows,
        ]
        of index.byNormalizedNumber.entries()
    ) {
        if (
            rows.length <= 1
        ) {
            continue;
        }

        duplicates.push({
            normalizedNumber,

            occurrences:
                rows.length,

            excelRows:
                rows
                    .map(
                        (row) =>
                            row.excelRow
                    )
                    .join(", "),

            numbers:
                rows
                    .map(
                        (row) =>
                            row.numberExcel
                    )
                    .join(" | "),

            clients:
                rows
                    .map(
                        (row) =>
                            row.clientExcel
                    )
                    .join(" | "),

            documentCategory:
                rows[0]
                    ?.documentCategory ??
                "",
        });
    }

    return {
        index:
            index.byNormalizedNumber,

        duplicates,
    };
}

/* ============================================================
   RECHERCHE DANS FIRESTORE
============================================================ */

function findFirestoreMatches({
    firestoreIndexes,
    normalizedNumber,
    expectedType,
}) {
    const allMatches =
        firestoreIndexes
            .byNormalizedNumber
            .get(
                normalizedNumber
            ) ?? [];

    const expectedTypeMatches =
        allMatches.filter(
            (document) =>
                document.firestoreType ===
                expectedType
        );

    const otherTypeMatches =
        allMatches.filter(
            (document) =>
                document.firestoreType !==
                expectedType
        );

    return {
        allMatches,
        expectedTypeMatches,
        otherTypeMatches,
    };
}

/* ============================================================
   LISTE DES DOCUMENTS MANQUANTS
============================================================ */

function findMissingExcelDocuments({
    excelDocuments,
    firestoreIndexes,
    expectedType,
}) {
    return excelDocuments.filter(
        (excelDocument) => {
            const key =
                `${expectedType}::${excelDocument.normalizedNumber}`;

            const matches =
                firestoreIndexes
                    .byTypeAndNumber
                    .get(
                        key
                    ) ?? [];

            return (
                matches.length === 0
            );
        }
    );
}

/* ============================================================
   RECHERCHE RÉCURSIVE DES PDF
============================================================ */

function isPathInside(
    parentPath,
    childPath
) {
    const resolvedParent =
        path.resolve(parentPath);

    const resolvedChild =
        path.resolve(childPath);

    const relative =
        path.relative(
            resolvedParent,
            resolvedChild
        );

    return (
        relative === "" ||
        (
            !relative.startsWith("..") &&
            !path.isAbsolute(relative)
        )
    );
}

/**
 * Parcourt récursivement PDF_ROOT.
 *
 * Important :
 * OUTPUT_DIRECTORY est volontairement exclu,
 * car il contient uniquement les fichiers produits
 * par les scripts.
 */
function walkPdfDirectory(
    directoryPath
) {
    const results = [];

    if (
        !fs.existsSync(
            directoryPath
        )
    ) {
        return results;
    }

    if (
        isPathInside(
            OUTPUT_DIRECTORY,
            directoryPath
        )
    ) {
        return results;
    }

    let entries = [];

    try {
        entries =
            fs.readdirSync(
                directoryPath,
                {
                    withFileTypes: true,
                }
            );
    } catch (error) {
        console.warn(
            "Répertoire non lisible :",
            directoryPath,
            "|",
            error.message
        );

        return results;
    }

    for (
        const entry
        of entries
    ) {
        const fullPath =
            path.join(
                directoryPath,
                entry.name
            );

        if (
            entry.isDirectory()
        ) {
            if (
                isPathInside(
                    OUTPUT_DIRECTORY,
                    fullPath
                )
            ) {
                continue;
            }

            results.push(
                ...walkPdfDirectory(
                    fullPath
                )
            );

            continue;
        }

        if (
            !entry.isFile()
        ) {
            continue;
        }

        const extension =
            path.extname(
                entry.name
            ).toLowerCase();

        if (
            extension !== ".pdf"
        ) {
            continue;
        }

        const baseName =
            path.basename(
                entry.name,
                extension
            );

        let stats;

        try {
            stats =
                fs.statSync(
                    fullPath
                );
        } catch (error) {
            console.warn(
                "Fichier inaccessible :",
                fullPath,
                "|",
                error.message
            );

            continue;
        }

        results.push({
            fileName:
                entry.name,

            baseName,

            extension,

            filePath:
                fullPath,

            directoryPath,

            relativePath:
                path.relative(
                    PDF_ROOT,
                    fullPath
                ),

            fileSize:
                stats.size,

            modifiedAt:
                stats.mtime,

            invoiceKey:
                normalizeInvoiceNumber(
                    baseName
                ),

            proformaKey:
                normalizeProformaNumber(
                    baseName
                ),
        });
    }

    return results;
}

/* ============================================================
   INDEXATION DES PDF
============================================================ */

function buildPdfIndexes(
    pdfFiles
) {
    const invoiceByKey =
        new Map();

    const proformaByKey =
        new Map();

    const byExactBaseName =
        new Map();

    for (
        const file
        of pdfFiles
    ) {
        addToIndex(
            invoiceByKey,
            file.invoiceKey,
            file
        );

        addToIndex(
            proformaByKey,
            file.proformaKey,
            file
        );

        addToIndex(
            byExactBaseName,
            prepareDocumentText(
                file.baseName
            ),
            file
        );
    }

    return {
        invoiceByKey,
        proformaByKey,
        byExactBaseName,
    };
}

/* ============================================================
   RECHERCHE DES PDF POUR UN DOCUMENT
============================================================ */

function findPdfMatches({
    pdfIndexes,
    normalizedNumber,
    expectedType,
}) {
    const sourceIndex =
        expectedType === "invoice"
            ? pdfIndexes.invoiceByKey
            : pdfIndexes.proformaByKey;

    const matches =
        sourceIndex.get(
            normalizedNumber
        ) ?? [];

    const uniqueMatches =
        uniqueByPath(
            matches
        );

    const validFiles =
        uniqueMatches.filter(
            (file) =>
                file.fileSize > 0
        );

    const emptyFiles =
        uniqueMatches.filter(
            (file) =>
                file.fileSize === 0
        );

    return {
        matches:
            uniqueMatches,

        validFiles,

        emptyFiles,

        count:
            uniqueMatches.length,

        validCount:
            validFiles.length,

        emptyCount:
            emptyFiles.length,
    };
}

/* ============================================================
   DESCRIPTION DES CORRESPONDANCES PDF
============================================================ */

function joinFileProperty(
    files,
    propertyName
) {
    return files
        .map(
            (file) =>
                file[propertyName]
        )
        .filter(Boolean)
        .join(" | ");
}

function buildPdfDetails(
    pdfResult
) {
    return {
        pdfPresent:
            pdfResult.validCount > 0
                ? "OUI"
                : "NON",

        numberOfPdfMatches:
            pdfResult.count,

        numberOfValidPdf:
            pdfResult.validCount,

        numberOfEmptyPdf:
            pdfResult.emptyCount,

        pdfFileNames:
            joinFileProperty(
                pdfResult.matches,
                "fileName"
            ),

        pdfPaths:
            joinFileProperty(
                pdfResult.matches,
                "filePath"
            ),

        pdfRelativePaths:
            joinFileProperty(
                pdfResult.matches,
                "relativePath"
            ),

        pdfDirectories:
            joinFileProperty(
                pdfResult.matches,
                "directoryPath"
            ),

        pdfSizes:
            pdfResult.matches
                .map(
                    (file) =>
                        file.fileSize
                )
                .join(" | "),
    };
}

/* ============================================================
   CONTRÔLE DES VARIANTES ATTENDUES
============================================================ */

/**
 * Cette fonction donne une explication lisible sur la manière
 * dont le PDF a été retrouvé.
 */
function determinePdfMatchReason({
    excelNumber,
    normalizedNumber,
    pdfFiles,
    expectedType,
}) {
    if (
        !pdfFiles.length
    ) {
        return "";
    }

    const originalPrepared =
        prepareDocumentText(
            excelNumber
        );

    const exactFile =
        pdfFiles.find(
            (file) =>
                prepareDocumentText(
                    file.baseName
                ) === originalPrepared
        );

    if (exactFile) {
        return "NOM_IDENTIQUE";
    }

    if (
        expectedType === "invoice"
    ) {
        const hasSeparatorDifference =
            pdfFiles.some(
                (file) => {
                    const base =
                        prepareDocumentText(
                            file.baseName
                        );

                    return (
                        base.replace(/-/g, "_") ===
                        originalPrepared.replace(/-/g, "_")
                    );
                }
            );

        if (
            hasSeparatorDifference
        ) {
            return "SEPARATEURS_DIFFERENTS";
        }

        const normalizedFromExcel =
            normalizeInvoiceNumber(
                excelNumber
            );

        const normalizedMatch =
            pdfFiles.some(
                (file) =>
                    normalizeInvoiceNumber(
                        file.baseName
                    ) === normalizedFromExcel
            );

        if (
            normalizedMatch
        ) {
            return "NUMERO_NORMALISE_SUR_3_CHIFFRES";
        }
    }

    if (
        expectedType === "proforma"
    ) {
        const hasCrepoliaPrefix =
            pdfFiles.some(
                (file) =>
                    /^proforma[\s_-]*crepolia/i.test(
                        file.baseName
                    )
            );

        if (
            hasCrepoliaPrefix
        ) {
            return "PREFIXE_PROFORMA_CREPOLIA";
        }

        const hasProformaPrefix =
            pdfFiles.some(
                (file) =>
                    /^proforma[\s_-]*/i.test(
                        file.baseName
                    )
            );

        if (
            hasProformaPrefix
        ) {
            return "PREFIXE_PROFORMA";
        }
    }

    return (
        `CORRESPONDANCE_PAR_CLE_NORMALISEE:` +
        normalizedNumber
    );
}

/* ============================================================
   MOTEUR DE DIAGNOSTIC
============================================================ */

function diagnoseMissingDocument({
    excelDocument,
    expectedType,
    firestoreIndexes,
    pdfIndexes,
    excelDuplicateIndex,
}) {
    const firestoreResult =
        findFirestoreMatches({
            firestoreIndexes,
            normalizedNumber:
                excelDocument.normalizedNumber,
            expectedType,
        });

    const pdfResult =
        findPdfMatches({
            pdfIndexes,
            normalizedNumber:
                excelDocument.normalizedNumber,
            expectedType,
        });

    const pdfDetails =
        buildPdfDetails(
            pdfResult
        );

    const duplicateRows =
        excelDuplicateIndex.get(
            excelDocument.normalizedNumber
        ) ?? [];

    const isExcelDuplicate =
        duplicateRows.length > 1;

    const pdfMatchReason =
        determinePdfMatchReason({
            excelNumber:
                excelDocument.numberExcel,
            normalizedNumber:
                excelDocument.normalizedNumber,
            pdfFiles:
                pdfResult.validFiles,
            expectedType,
        });

    let probableCause =
        "NON_DETERMINEE";

    let readyToReimport =
        "NON";

    let confidence =
        0;

    let actionRecommended =
        "";

    if (
        firestoreResult
            .expectedTypeMatches
            .length > 0
    ) {
        probableCause =
            "DEJA_PRESENT_DANS_FIRESTORE";

        confidence =
            100;

        actionRecommended =
            "AUCUNE_ACTION";
    } else if (
        firestoreResult
            .otherTypeMatches
            .length > 0
    ) {
        probableCause =
            "PRESENT_AVEC_UN_AUTRE_TYPE_FIRESTORE";

        confidence =
            100;

        actionRecommended =
            "VERIFIER_ET_CORRIGER_LE_TYPE";
    } else if (
        isExcelDuplicate
    ) {
        probableCause =
            "DOUBLON_DANS_EXCEL";

        confidence =
            100;

        actionRecommended =
            "VERIFIER_LE_DOUBLON_AVANT_IMPORT";
    } else if (
        pdfResult.validCount === 1
    ) {
        probableCause =
            "PDF_PRESENT_DOCUMENT_A_REIMPORTER";

        readyToReimport =
            "OUI";

        confidence =
            100;

        actionRecommended =
            "REIMPORTER";
    } else if (
        pdfResult.validCount > 1
    ) {
        probableCause =
            "PLUSIEURS_PDF_CORRESPONDANTS";

        confidence =
            70;

        actionRecommended =
            "CHOISIR_LE_BON_PDF_AVANT_IMPORT";
    } else if (
        pdfResult.emptyCount > 0
    ) {
        probableCause =
            "PDF_VIDE";

        confidence =
            100;

        actionRecommended =
            "REMPLACER_LE_PDF_VIDE";
    } else {
        probableCause =
            "PDF_ABSENT";

        confidence =
            100;

        actionRecommended =
            "RECHERCHER_OU_REGENERER_LE_PDF";
    }

    return {
        categorieDocument:
            excelDocument.documentCategory,

        typeAttendu:
            expectedType,

        ligneExcel:
            excelDocument.excelRow,

        numeroExcel:
            excelDocument.numberExcel,

        numeroNormalise:
            excelDocument.normalizedNumber,

        clientExcel:
            excelDocument.clientExcel,

        montantExcel:
            excelDocument.amountExcel,

        dateExcel:
            excelDocument.dateExcel,

        existeFirestoreTypeAttendu:
            firestoreResult
                .expectedTypeMatches
                .length > 0
                ? "OUI"
                : "NON",

        existeFirestoreAutreType:
            firestoreResult
                .otherTypeMatches
                .length > 0
                ? "OUI"
                : "NON",

        typesFirestoreTrouves:
            firestoreResult
                .allMatches
                .map(
                    (document) =>
                        document.firestoreType
                )
                .join(" | "),

        numerosFirestoreTrouves:
            firestoreResult
                .allMatches
                .map(
                    (document) =>
                        document.numberFirestore
                )
                .join(" | "),

        firestoreIds:
            firestoreResult
                .allMatches
                .map(
                    (document) =>
                        document.firestoreId
                )
                .join(" | "),

        clientsFirestore:
            firestoreResult
                .allMatches
                .map(
                    (document) =>
                        document.clientFirestore
                )
                .join(" | "),

        fichiersFirestore:
            firestoreResult
                .allMatches
                .map(
                    (document) =>
                        document.fileNameFirestore
                )
                .join(" | "),

        importBatchFirestore:
            firestoreResult
                .allMatches
                .map(
                    (document) =>
                        document.importBatch
                )
                .join(" | "),

        ...pdfDetails,

        raisonCorrespondancePdf:
            pdfMatchReason,

        doublonExcel:
            isExcelDuplicate
                ? "OUI"
                : "NON",

        nombreOccurrencesExcel:
            duplicateRows.length,

        lignesDoublonsExcel:
            duplicateRows
                .map(
                    (row) =>
                        row.excelRow
                )
                .join(", "),

        clientsDoublonsExcel:
            duplicateRows
                .map(
                    (row) =>
                        row.clientExcel
                )
                .join(" | "),

        pretAReimporter:
            readyToReimport,

        causeProbable:
            probableCause,

        actionRecommandee:
            actionRecommended,

        confiancePourcentage:
            confidence,
    };
}

/* ============================================================
   CONSTRUCTION DES DIAGNOSTICS PAR TYPE
============================================================ */

function buildDiagnosticsForType({
    excelDocuments,
    expectedType,
    firestoreIndexes,
    pdfIndexes,
}) {
    const excelDuplicateData =
        buildExcelDuplicates(
            excelDocuments
        );

    const missingDocuments =
        findMissingExcelDocuments({
            excelDocuments,
            firestoreIndexes,
            expectedType,
        });

    const diagnostics =
        missingDocuments.map(
            (excelDocument) =>
                diagnoseMissingDocument({
                    excelDocument,
                    expectedType,
                    firestoreIndexes,
                    pdfIndexes,
                    excelDuplicateIndex:
                        excelDuplicateData.index,
                })
        );

    return {
        missingDocuments,
        diagnostics,
        excelDuplicates:
            excelDuplicateData.duplicates,
    };
}

/* ============================================================
   SYNTHÈSES
============================================================ */

function countRowsByField(
    rows,
    fieldName
) {
    const counts =
        new Map();

    for (
        const row
        of rows
    ) {
        const key =
            cleanText(
                row[fieldName]
            ) || "VIDE";

        counts.set(
            key,
            (counts.get(key) ?? 0) + 1
        );
    }

    return Array.from(
        counts.entries()
    )
        .map(
            ([value, count]) => ({
                valeur:
                    value,

                nombre:
                    count,
            })
        )
        .sort(
            (a, b) =>
                b.nombre - a.nombre
        );
}

function buildCauseSummary(
    diagnostics
) {
    return countRowsByField(
        diagnostics,
        "causeProbable"
    ).map(
        (row) => ({
            cause:
                row.valeur,

            nombre:
                row.nombre,
        })
    );
}

function buildActionSummary(
    diagnostics
) {
    return countRowsByField(
        diagnostics,
        "actionRecommandee"
    ).map(
        (row) => ({
            action:
                row.valeur,

            nombre:
                row.nombre,
        })
    );
}

function buildClientSummary(
    diagnostics
) {
    const grouped =
        new Map();

    for (
        const row
        of diagnostics
    ) {
        const client =
            cleanText(
                row.clientExcel
            ) || "CLIENT_NON_RENSEIGNE";

        const key =
            `${row.categorieDocument}::${client.toLowerCase()}`;

        if (
            !grouped.has(key)
        ) {
            grouped.set(
                key,
                {
                    categorieDocument:
                        row.categorieDocument,

                    clientExcel:
                        client,

                    documentsManquants:
                        0,

                    pretsAReimporter:
                        0,

                    pdfAbsents:
                        0,

                    doublonsExcel:
                        0,

                    autreTypeFirestore:
                        0,
                }
            );
        }

        const current =
            grouped.get(key);

        current.documentsManquants++;

        if (
            row.pretAReimporter ===
            "OUI"
        ) {
            current.pretsAReimporter++;
        }

        if (
            row.pdfPresent ===
            "NON"
        ) {
            current.pdfAbsents++;
        }

        if (
            row.doublonExcel ===
            "OUI"
        ) {
            current.doublonsExcel++;
        }

        if (
            row.existeFirestoreAutreType ===
            "OUI"
        ) {
            current.autreTypeFirestore++;
        }
    }

    return Array.from(
        grouped.values()
    ).sort(
        (a, b) =>
            b.documentsManquants -
            a.documentsManquants
    );
}

/* ============================================================
   FILTRES DE SORTIE
============================================================ */

function filterReadyToReimport(
    diagnostics
) {
    return diagnostics.filter(
        (row) =>
            row.pretAReimporter ===
            "OUI"
    );
}

function filterPdfMissing(
    diagnostics
) {
    return diagnostics.filter(
        (row) =>
            row.pdfPresent ===
            "NON"
    );
}

function filterMultiplePdf(
    diagnostics
) {
    return diagnostics.filter(
        (row) =>
            row.numberOfValidPdf > 1
    );
}

function filterOtherFirestoreType(
    diagnostics
) {
    return diagnostics.filter(
        (row) =>
            row.existeFirestoreAutreType ===
            "OUI"
    );
}

function filterExcelDuplicates(
    diagnostics
) {
    return diagnostics.filter(
        (row) =>
            row.doublonExcel ===
            "OUI"
    );
}

/* ============================================================
   CONTRÔLE GLOBAL
============================================================ */

function buildGlobalControl({
    invoiceExcelCount,
    proformaExcelCount,
    invoiceFirestoreCount,
    proformaFirestoreCount,
    invoiceDiagnostics,
    proformaDiagnostics,
}) {
    const invoicePresent =
        invoiceExcelCount -
        invoiceDiagnostics.length;

    const proformaPresent =
        proformaExcelCount -
        proformaDiagnostics.length;

    return [
        {
            categorie:
                "Factures",

            indicateur:
                "Documents Excel",

            valeur:
                invoiceExcelCount,
        },

        {
            categorie:
                "Factures",

            indicateur:
                "Documents Firestore",

            valeur:
                invoiceFirestoreCount,
        },

        {
            categorie:
                "Factures",

            indicateur:
                "Présents dans Excel et Firestore",

            valeur:
                invoicePresent,
        },

        {
            categorie:
                "Factures",

            indicateur:
                "Manquants dans Firestore",

            valeur:
                invoiceDiagnostics.length,
        },

        {
            categorie:
                "Proformas",

            indicateur:
                "Documents Excel",

            valeur:
                proformaExcelCount,
        },

        {
            categorie:
                "Proformas",

            indicateur:
                "Documents Firestore",

            valeur:
                proformaFirestoreCount,
        },

        {
            categorie:
                "Proformas",

            indicateur:
                "Présents dans Excel et Firestore",

            valeur:
                proformaPresent,
        },

        {
            categorie:
                "Proformas",

            indicateur:
                "Manquants dans Firestore",

            valeur:
                proformaDiagnostics.length,
        },
    ];
}
/* ============================================================
   GÉNÉRATION DES FEUILLES EXCEL
============================================================ */

function appendWorksheet(
    workbook,
    rows,
    sheetName
) {
    const safeRows =
        rows.length > 0
            ? rows
            : [
                {
                    info:
                        "Aucune donnée",
                },
            ];

    const worksheet =
        XLSX.utils.json_to_sheet(
            safeRows
        );

    const headers =
        Object.keys(
            safeRows[0]
        );

    worksheet["!autofilter"] = {
        ref:
            `A1:` +
            `${XLSX.utils.encode_col(
                headers.length - 1
            )}` +
            `${safeRows.length + 1}`,
    };

    worksheet["!cols"] =
        headers.map(
            (header) => ({
                wch:
                    Math.min(
                        Math.max(
                            String(header).length + 2,
                            14
                        ),
                        60
                    ),
            })
        );

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        sheetName.substring(
            0,
            31
        )
    );
}

/* ============================================================
   PROGRAMME PRINCIPAL
============================================================ */

async function main() {
    console.log(
        "============================================"
    );

    console.log(
        "DIAGNOSTIC DES ARCHIVES MANQUANTES V2"
    );

    console.log(
        "============================================"
    );

    /* ----------------------------------------------------------
       1. Contrôle des chemins
    ---------------------------------------------------------- */

    if (
        !fs.existsSync(
            SOURCE_EXCEL_PATH
        )
    ) {
        throw new Error(
            `Classeur source introuvable : ${SOURCE_EXCEL_PATH}`
        );
    }

    if (
        !fs.existsSync(
            PDF_ROOT
        )
    ) {
        throw new Error(
            `Répertoire racine des PDF introuvable : ${PDF_ROOT}`
        );
    }

    if (
        !fs.existsSync(
            OUTPUT_DIRECTORY
        )
    ) {
        fs.mkdirSync(
            OUTPUT_DIRECTORY,
            {
                recursive: true,
            }
        );
    }

    console.log(
        "Classeur source :",
        SOURCE_EXCEL_PATH
    );

    console.log(
        "Répertoire racine PDF :",
        PDF_ROOT
    );

    console.log(
        "Répertoire de sortie exclu :",
        OUTPUT_DIRECTORY
    );

    /* ----------------------------------------------------------
       2. Lecture Excel
    ---------------------------------------------------------- */

    console.log("");
    console.log(
        "Lecture du classeur Excel..."
    );

    const workbook =
        XLSX.readFile(
            SOURCE_EXCEL_PATH,
            {
                cellDates: true,
            }
        );

    console.log(
        "Feuilles disponibles :",
        workbook.SheetNames.join(
            ", "
        )
    );

    const invoiceConfig =
        DOCUMENT_CONFIGS.find(
            (config) =>
                config.firestoreType ===
                "invoice"
        );

    const proformaConfig =
        DOCUMENT_CONFIGS.find(
            (config) =>
                config.firestoreType ===
                "proforma"
        );

    if (
        !invoiceConfig ||
        !proformaConfig
    ) {
        throw new Error(
            "Configuration Factures/Proformas incomplète."
        );
    }

    const invoiceExcelResult =
        readExcelDocuments(
            workbook,
            invoiceConfig
        );

    const proformaExcelResult =
        readExcelDocuments(
            workbook,
            proformaConfig
        );

    console.log(
        "Factures Excel :",
        invoiceExcelResult
            .documentCount
    );

    console.log(
        "Proformas Excel :",
        proformaExcelResult
            .documentCount
    );

    /* ----------------------------------------------------------
       3. Lecture récursive des PDF
    ---------------------------------------------------------- */

    console.log("");
    console.log(
        "Recherche récursive des PDF..."
    );

    const pdfFiles =
        walkPdfDirectory(
            PDF_ROOT
        );

    console.log(
        "PDF trouvés :",
        pdfFiles.length
    );

    const pdfIndexes =
        buildPdfIndexes(
            pdfFiles
        );

    /* ----------------------------------------------------------
       4. Lecture Firestore
    ---------------------------------------------------------- */

    console.log("");
    console.log(
        "Lecture de Firestore..."
    );

    const firebase =
        initFirebase();

    const db =
        firebase.firestore();

    const firestoreDocuments =
        await loadFirestoreDocuments(
            db
        );

    console.log(
        "Documents Firestore :",
        firestoreDocuments.length
    );

    const firestoreIndexes =
        buildFirestoreIndexes(
            firestoreDocuments
        );

    const invoiceFirestoreDocuments =
        firestoreDocuments.filter(
            (document) =>
                document.firestoreType ===
                "invoice"
        );

    const proformaFirestoreDocuments =
        firestoreDocuments.filter(
            (document) =>
                document.firestoreType ===
                "proforma"
        );

    console.log(
        "Factures Firestore :",
        invoiceFirestoreDocuments.length
    );

    console.log(
        "Proformas Firestore :",
        proformaFirestoreDocuments.length
    );

    /* ----------------------------------------------------------
       5. Diagnostic Factures
    ---------------------------------------------------------- */

    console.log("");
    console.log(
        "===== DIAGNOSTIC FACTURES ====="
    );

    const invoiceResult =
        buildDiagnosticsForType({
            excelDocuments:
                invoiceExcelResult.documents,

            expectedType:
                "invoice",

            firestoreIndexes,

            pdfIndexes,
        });

    console.log(
        "Factures manquantes dans Firestore :",
        invoiceResult
            .diagnostics
            .length
    );

    console.log(
        "Factures prêtes à réimporter :",
        filterReadyToReimport(
            invoiceResult.diagnostics
        ).length
    );

    console.log(
        "Factures sans PDF :",
        filterPdfMissing(
            invoiceResult.diagnostics
        ).length
    );

    /* ----------------------------------------------------------
       6. Diagnostic Proformas
    ---------------------------------------------------------- */

    console.log("");
    console.log(
        "===== DIAGNOSTIC PROFORMAS ====="
    );

    const proformaResult =
        buildDiagnosticsForType({
            excelDocuments:
                proformaExcelResult.documents,

            expectedType:
                "proforma",

            firestoreIndexes,

            pdfIndexes,
        });

    console.log(
        "Proformas manquantes dans Firestore :",
        proformaResult
            .diagnostics
            .length
    );

    console.log(
        "Proformas prêtes à réimporter :",
        filterReadyToReimport(
            proformaResult.diagnostics
        ).length
    );

    console.log(
        "Proformas sans PDF :",
        filterPdfMissing(
            proformaResult.diagnostics
        ).length
    );

    /* ----------------------------------------------------------
       7. Consolidation
    ---------------------------------------------------------- */

    const allDiagnostics = [
        ...invoiceResult
            .diagnostics,

        ...proformaResult
            .diagnostics,
    ];

    const readyToReimport =
        filterReadyToReimport(
            allDiagnostics
        );

    const pdfMissing =
        filterPdfMissing(
            allDiagnostics
        );

    const multiplePdf =
        filterMultiplePdf(
            allDiagnostics
        );

    const otherFirestoreType =
        filterOtherFirestoreType(
            allDiagnostics
        );

    const duplicateDiagnostics =
        filterExcelDuplicates(
            allDiagnostics
        );

    const allExcelDuplicates = [
        ...invoiceResult
            .excelDuplicates,

        ...proformaResult
            .excelDuplicates,
    ];

    const causeSummary =
        buildCauseSummary(
            allDiagnostics
        );

    const actionSummary =
        buildActionSummary(
            allDiagnostics
        );

    const clientSummary =
        buildClientSummary(
            allDiagnostics
        );

    const globalSummary =
        buildGlobalControl({
            invoiceExcelCount:
                invoiceExcelResult
                    .documentCount,

            proformaExcelCount:
                proformaExcelResult
                    .documentCount,

            invoiceFirestoreCount:
                invoiceFirestoreDocuments
                    .length,

            proformaFirestoreCount:
                proformaFirestoreDocuments
                    .length,

            invoiceDiagnostics:
                invoiceResult
                    .diagnostics,

            proformaDiagnostics:
                proformaResult
                    .diagnostics,
        });

    globalSummary.push(
        {
            categorie:
                "Global",

            indicateur:
                "PDF trouvés dans les répertoires",

            valeur:
                pdfFiles.length,
        },

        {
            categorie:
                "Global",

            indicateur:
                "Documents manquants analysés",

            valeur:
                allDiagnostics.length,
        },

        {
            categorie:
                "Global",

            indicateur:
                "Documents prêts à réimporter",

            valeur:
                readyToReimport.length,
        },

        {
            categorie:
                "Global",

            indicateur:
                "Documents sans PDF",

            valeur:
                pdfMissing.length,
        },

        {
            categorie:
                "Global",

            indicateur:
                "Documents avec plusieurs PDF",

            valeur:
                multiplePdf.length,
        },

        {
            categorie:
                "Global",

            indicateur:
                "Documents présents sous un autre type Firestore",

            valeur:
                otherFirestoreType.length,
        },

        {
            categorie:
                "Global",

            indicateur:
                "Doublons Excel",

            valeur:
                allExcelDuplicates.length,
        }
    );

    /* ----------------------------------------------------------
       8. Génération du rapport
    ---------------------------------------------------------- */

    const outputWorkbook =
        XLSX.utils.book_new();

    appendWorksheet(
        outputWorkbook,
        globalSummary,
        "01_summary"
    );

    appendWorksheet(
        outputWorkbook,
        causeSummary,
        "02_causes"
    );

    appendWorksheet(
        outputWorkbook,
        actionSummary,
        "03_actions"
    );

    appendWorksheet(
        outputWorkbook,
        clientSummary,
        "04_clients"
    );

    appendWorksheet(
        outputWorkbook,
        invoiceResult
            .diagnostics,
        "05_missing_invoices"
    );

    appendWorksheet(
        outputWorkbook,
        proformaResult
            .diagnostics,
        "06_missing_proformas"
    );

    appendWorksheet(
        outputWorkbook,
        readyToReimport,
        "07_ready_to_reimport"
    );

    appendWorksheet(
        outputWorkbook,
        pdfMissing,
        "08_pdf_missing"
    );

    appendWorksheet(
        outputWorkbook,
        multiplePdf,
        "09_multiple_pdf"
    );

    appendWorksheet(
        outputWorkbook,
        otherFirestoreType,
        "10_wrong_firestore_type"
    );

    appendWorksheet(
        outputWorkbook,
        duplicateDiagnostics,
        "11_duplicate_diagnostics"
    );

    appendWorksheet(
        outputWorkbook,
        allExcelDuplicates,
        "12_excel_duplicates"
    );

    appendWorksheet(
        outputWorkbook,
        pdfFiles.map(
            (file) => ({
                fileName:
                    file.fileName,

                filePath:
                    file.filePath,

                relativePath:
                    file.relativePath,

                directoryPath:
                    file.directoryPath,

                fileSize:
                    file.fileSize,

                modifiedAt:
                    file.modifiedAt,

                invoiceKey:
                    file.invoiceKey,

                proformaKey:
                    file.proformaKey,
            })
        ),
        "13_all_pdf_files"
    );

    XLSX.writeFile(
        outputWorkbook,
        OUTPUT_PATH
    );

    /* ----------------------------------------------------------
       9. Résumé console
    ---------------------------------------------------------- */

    console.log("");
    console.log(
        "============================================"
    );

    console.log(
        "RÉSUMÉ GLOBAL"
    );

    console.log(
        "============================================"
    );

    console.table(
        globalSummary
    );

    console.log("");
    console.log(
        "CAUSES PROBABLES"
    );

    console.table(
        causeSummary
    );

    console.log("");
    console.log(
        "ACTIONS RECOMMANDÉES"
    );

    console.table(
        actionSummary
    );

    console.log("");
    console.log(
        "Rapport généré :",
        OUTPUT_PATH
    );
}

/* ============================================================
   EXÉCUTION
============================================================ */

main().catch(
    (error) => {
        console.error("");
        console.error(
            "ERREUR FATALE :",
            error
        );

        console.error(
            error?.stack ?? ""
        );

        process.exit(1);
    }
);