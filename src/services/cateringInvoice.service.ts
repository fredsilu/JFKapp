import {
    addDoc,
    collection,
    doc,
    serverTimestamp,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { getNextInvoiceNumber } from '@/src/services/invoiceNumber.service';

import {
    getDocs,
    query,
    orderBy,
} from 'firebase/firestore';

import { getDoc } from 'firebase/firestore';

const COLLECTION = 'catering_invoices';

export async function getCateringInvoiceById(
    id: string
): Promise<CateringInvoice | null> {
    const ref = doc(db, COLLECTION, id);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    return {
        id: snap.id,
        ...(snap.data() as Omit<CateringInvoice, 'id'>),
    };
}



export async function getCateringInvoices(): Promise<CateringInvoice[]> {
    const q = query(
        collection(db, COLLECTION),
        orderBy('createdAt', 'desc')
    );

    const snap = await getDocs(q);

    const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<CateringInvoice, 'id'>),
    }));

    return data.sort((a, b) => {
        const aTime =
            a.createdAt?.toMillis?.() ||
            new Date(a.issueDate || '').getTime() ||
            0;

        const bTime =
            b.createdAt?.toMillis?.() ||
            new Date(b.issueDate || '').getTime() ||
            0;

        return bTime - aTime;
    });
}

export type CateringInvoice = {
    id?: string;
    proformaId: string;

    number: string;

    clientName?: string;
    clientRccm?: string;
    clientIdnat?: string;
    clientAddress?: string;
    clientCity?: string;

    issueDate: string;

    items: any[];
    totals: {
        subtotal: number;
        tax?: number;
        total: number;
        currency: 'USD' | 'CDF';
    };

    createdAt?: any;
};

/* =========================================
   CREATE INVOICE FROM ORDER
========================================= */
export async function createInvoiceFromOrder(order: any) {

    if (!order?.id) {
        throw new Error('Commande invalide');
    }

    const invoiceNumber = await getNextInvoiceNumber();

    const invoice = {
        orderId: order.id,
        orderNumber: order.number ?? '',

        clientId: order.clientId ?? '',
        clientName: order.client?.name ?? '',

        issueDate: new Date().toISOString(),

        items: order.items ?? [],
        totals: order.totals ?? {
            subtotal: 0,
            total: 0,
            currency: 'USD',
        },

        status: 'issued',

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    const ref = await addDoc(collection(db, 'catering_invoices'), {
        ...invoice,
        number: invoiceNumber,
    });

    return {
        id: ref.id,
        number: invoiceNumber,
        ...invoice,
    };
}

export async function createInvoiceFromProforma(proforma: any) {
    const number = await getNextInvoiceNumber();

    const ref = await addDoc(collection(db, COLLECTION), {
        proformaId: proforma.id,

        number,

        clientName: proforma.clientName,
        clientRccm: proforma.clientRccm,
        clientIdnat: proforma.clientIdnat,
        clientAddress: proforma.clientAddress,
        clientCity: proforma.clientCity,

        issueDate: new Date().toISOString(),

        items: proforma.items,
        totals: proforma.totals,

        createdAt: serverTimestamp(),
    });

    return {
        id: ref.id,
        number,
    };
}