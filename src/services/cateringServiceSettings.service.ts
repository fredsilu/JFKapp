import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

const COLLECTION = "catering_service_settings";
const DOCUMENT_ID = "default";

export type CateringServiceSettings = {
    serverDailyCost: number;
    cookDailyCost: number;

    defaultServerRate: number;
    defaultCookRate: number;

    electricityDailyCost: number;
    gasDailyCost: number;
    fuelDailyCost: number;

    updatedAt?: any;
};

export const DEFAULT_CATERING_SERVICE_SETTINGS: CateringServiceSettings = {
    serverDailyCost: 0,
    cookDailyCost: 0,

    defaultServerRate: 25,
    defaultCookRate: 50,

    electricityDailyCost: 0,
    gasDailyCost: 0,
    fuelDailyCost: 0,
};

export async function getCateringServiceSettings(): Promise<CateringServiceSettings> {
    const ref = doc(db, COLLECTION, DOCUMENT_ID);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        await setDoc(ref, {
            ...DEFAULT_CATERING_SERVICE_SETTINGS,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        return DEFAULT_CATERING_SERVICE_SETTINGS;
    }

    const data = snap.data() as Partial<CateringServiceSettings>;

    return {
        ...DEFAULT_CATERING_SERVICE_SETTINGS,
        ...data,
    };
}

export async function updateCateringServiceSettings(
    settings: Partial<CateringServiceSettings>
): Promise<void> {
    const ref = doc(db, COLLECTION, DOCUMENT_ID);

    await setDoc(
        ref,
        {
            ...settings,
            updatedAt: serverTimestamp(),
        },
        { merge: true }
    );
}