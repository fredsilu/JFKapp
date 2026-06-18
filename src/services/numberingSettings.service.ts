//src/services/numberingSettings.service.ts
import {
  collection,
  doc,
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

  return Number(match[1]);
}

/* =========================================
   READ CURRENT COUNTERS
========================================= */

export async function getNumberingCounters(
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

  return {
    invoice: invoiceCounter,
    proforma: proformaCounter,
  };
}

/* =========================================
   MANUAL ADJUSTMENT
========================================= */

export async function setInvoiceCounter(
  value: number,
  year = new Date().getFullYear()
) {
  await setDoc(
    doc(db, "counters", `invoice_${year}`),
    {
      current: value,
      value,
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
  await setDoc(
    doc(db, "counters", `proforma_${year}`),
    {
      current: value,
      value,
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
) {
  const counters = await getNumberingCounters(year);

  await Promise.all([
    setInvoiceCounter(counters.invoice, year),
    setProformaCounter(counters.proforma, year),
  ]);

  return counters;
}