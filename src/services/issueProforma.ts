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
import { Platform } from "react-native";

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

    if (!proforma.pdfUrl && Platform.OS !== "web") {
        if (!proforma.number) {
            throw new Error("Numéro de proforma manquant");
        }

        const pdfFile = await generateProformaPDFFile(proforma);

        pdfPayload = await uploadOfficialPdf({
            kind: "proformas",
            documentNumber: proforma.number,
            pdfBlob: pdfFile.blob,
        });
    }

    if (!proforma.pdfUrl && Platform.OS === "web") {
        console.warn(
            "PDF Storage ignoré sur Web : génération Blob PDF non supportée."
        );
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