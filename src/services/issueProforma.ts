//src/services/issueProforma.ts
import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp,
    Timestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import { CateringProforma } from "@/src/services/cateringProforma.service";

import {
    generateProformaPDFFile,
} from "@/src/services/invoicePdf.service";

import {
    uploadOfficialPdf,
} from "@/src/services/documentStorage.service";

const COLLECTION = "catering_proformas";

export async function issueProforma(
    proformaId: string
): Promise<CateringProforma> {
    const ref = doc(db, COLLECTION, proformaId);

    const snap = await getDoc(ref);

    if (!snap.exists()) {
        throw new Error("Proforma introuvable");
    }

    const proforma = {
        ...(snap.data() as Omit<CateringProforma, "id">),
        id: snap.id,
    } as CateringProforma & {
        pdfUrl?: string;
        pdfPath?: string;
        pdfGeneratedAt?: any;
    };

    if (proforma.status !== "draft") {
        throw new Error("La proforma ne peut pas être envoyée");
    }

    let pdfPayload: {
        pdfUrl?: string;
        pdfPath?: string;
        pdfGeneratedAt?: any;
    } = {};

    if (!proforma.pdfUrl) {
        const pdfFile = await generateProformaPDFFile(proforma);

        if (!proforma.number) {
            throw new Error("Numéro de proforma manquant");
        }

        pdfPayload = await uploadOfficialPdf({
            kind: "proformas",
            documentNumber: proforma.number,
            pdfBlob: pdfFile.blob,
        });
    }

    const now = serverTimestamp();

    await updateDoc(ref, {
        status: "sent",
        sentAt: now,
        updatedAt: now,
        ...pdfPayload,
    });

    return {
        ...proforma,
        status: "sent",
        sentAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ...pdfPayload,
    } as CateringProforma;
}