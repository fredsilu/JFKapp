// src/services/companySettings.service.ts
import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

const COLLECTION = "company_settings";
const DOCUMENT_ID = "default";

export type CompanyBankAccount = {
    bankName: string;
    accountNumber: string;
    currency: string;
    label?: string;
    isDefault?: boolean;
};

export type CompanySettings = {
    companyName: string;
    phone: string;
    email: string;
    address: string;

    rccm: string;
    idNat: string;
    nif: string;

    bankAccounts: CompanyBankAccount[];

    updatedAt?: any;
};

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
    companyName: "CREPOLIA",
    phone: "+243 898111165",
    email: "contact@crepolia.com",
    address: "54, Avenue de la Justice, C/Gombe",

    rccm: "CD/KNG/RCCM/20-A-00139",
    idNat: "01-852-N58548R",
    nif: "A2171348B",

    bankAccounts: [
        {
            bankName: "EQUITYBCDC",
            accountNumber: "0242000001008",
            currency: "USD",
            label: "Compte principal USD",
            isDefault: true,
        },
    ],
};

export async function getCompanySettings(): Promise<CompanySettings> {
    const ref = doc(db, COLLECTION, DOCUMENT_ID);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        await setDoc(ref, {
            ...DEFAULT_COMPANY_SETTINGS,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        return DEFAULT_COMPANY_SETTINGS;
    }

    const data = snap.data() as Partial<CompanySettings>;

    return {
        ...DEFAULT_COMPANY_SETTINGS,
        ...data,
        bankAccounts:
            data.bankAccounts && data.bankAccounts.length > 0
                ? data.bankAccounts
                : DEFAULT_COMPANY_SETTINGS.bankAccounts,
    };
}

export async function updateCompanySettings(
    settings: Partial<CompanySettings>
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

export function getDefaultBankAccount(
    settings: CompanySettings
): CompanyBankAccount {
    return (
        settings.bankAccounts.find((account) => account.isDefault) ??
        settings.bankAccounts[0] ??
        DEFAULT_COMPANY_SETTINGS.bankAccounts[0]
    );
}