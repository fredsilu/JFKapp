// src/services/numberingSettings.service.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export type NumberingCounters = {
  invoice: number;
  proforma: number;
};

function extractNumber(value?: string | null): number {
  if (!value) return 0;

  const match = value.match(/(\d+)$/);

  if (!match) return 0;

  const number = Number(match[1]);

  return Number.isFinite(number) ? number : 0;
}

function normalizeCounter(value: unknown): number {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) return 0;

  return Math.floor(number);
}

/* =========================================
   READ SAVED COUNTERS
========================================= */

export async function getNumberingCounters(
  year = new Date().getFullYear()
): Promise<NumberingCounters> {
  const [invoiceDoc, proformaDoc] = await Promise.all([
    getDoc(doc(db, "counters", `invoice_${year}`)),
    getDoc(doc(db, "counters", `proforma_${year}`)),
  ]);

  const invoiceData = invoiceDoc.exists() ? invoiceDoc.data() : null;
  const proformaData = proformaDoc.exists() ? proformaDoc.data() : null;

  return {
    invoice: normalizeCounter(
      invoiceData?.current ?? invoiceData?.value ?? 0
    ),
    proforma: normalizeCounter(
      proformaData?.current ?? proformaData?.value ?? 0
    ),
  };
}

/* =========================================
   MANUAL ADJUSTMENT
========================================= */

export async function setInvoiceCounter(
  value: number,
  year = new Date().getFullYear()
) {
  const safeValue = normalizeCounter(value);

  await setDoc(
    doc(db, "counters", `invoice_${year}`),
    {
      current: safeValue,
      value: safeValue,
      year,
      prefix: `CR${year}-FC`,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function setProformaCounter(
  value: number,
  year = new Date().getFullYear()
) {
  const safeValue = normalizeCounter(value);

  await setDoc(
    doc(db, "counters", `proforma_${year}`),
    {
      current: safeValue,
      value: safeValue,
      year,
      prefix: `CR${year}-PR`,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

/* =========================================
   RECALCULATE FROM DOCUMENTS
========================================= */

export async function recalculateCounters(
  year = new Date().getFullYear()
): Promise<NumberingCounters> {
  const [invoiceSnap, proformaSnap] = await Promise.all([
    getDocs(collection(db, "catering_invoices")),
    getDocs(collection(db, "catering_proformas")),
  ]);

  let invoiceCounter = 0;
  let proformaCounter = 0;

  invoiceSnap.forEach((d) => {
    const n = extractNumber(d.data()?.number);
    invoiceCounter = Math.max(invoiceCounter, n);
  });

  proformaSnap.forEach((d) => {
    const n = extractNumber(d.data()?.number);
    proformaCounter = Math.max(proformaCounter, n);
  });

  await Promise.all([
    setInvoiceCounter(invoiceCounter, year),
    setProformaCounter(proformaCounter, year),
  ]);

  return {
    invoice: invoiceCounter,
    proforma: proformaCounter,
  };
}