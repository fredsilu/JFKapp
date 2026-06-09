// src/services/cateringSectionTemplate.service.ts
import {
    addDoc,
    collection,
    doc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import {
    CateringSectionTemplate,
    CateringSectionType,
} from "@/types/catering";

const COLLECTION = "catering_section_templates";

export async function getCateringSectionTemplates(
    onlyActive = true
): Promise<CateringSectionTemplate[]> {
    const constraints: any[] = [];

    if (onlyActive) {
        constraints.push(where("isActive", "==", true));
    }

    constraints.push(orderBy("position", "asc"));

    const q = query(collection(db, COLLECTION), ...constraints);
    const snap = await getDocs(q);

    return snap.docs.map((document) => ({
        id: document.id,
        ...(document.data() as Omit<CateringSectionTemplate, "id">),
    }));
}

export async function createCateringSectionTemplate(payload: {
    key: string;
    name: string;
    type: CateringSectionType;
    position?: number;
}): Promise<CateringSectionTemplate> {
    const key = payload.key.trim();
    const name = payload.name.trim();

    if (!key) {
        throw new Error("La clé de rubrique est obligatoire");
    }

    if (!name) {
        throw new Error("Le nom de rubrique est obligatoire");
    }

    const data: Omit<CateringSectionTemplate, "id"> = {
        key,
        name,
        type: payload.type,
        position: Number(payload.position ?? 0),
        isActive: true,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
    };

    const ref = await addDoc(collection(db, COLLECTION), data);

    return {
        id: ref.id,
        ...data,
    };
}

export async function updateCateringSectionTemplate(
    id: string,
    payload: Partial<{
        key: string;
        name: string;
        type: CateringSectionType;
        position: number;
        isActive: boolean;
    }>
): Promise<void> {
    if (!id) {
        throw new Error("Rubrique invalide");
    }

    const cleanPayload: any = {
        ...payload,
        updatedAt: serverTimestamp(),
    };

    if (typeof payload.key === "string") {
        cleanPayload.key = payload.key.trim();
    }

    if (typeof payload.name === "string") {
        cleanPayload.name = payload.name.trim();
    }

    await updateDoc(doc(db, COLLECTION, id), cleanPayload);
}