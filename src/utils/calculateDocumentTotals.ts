// src/catering/utils/calculateDocumentTotals.ts

import {
  CateringDocumentItem,
  CateringDocumentTotals,
} from "@/types/documents";

export interface CalculatedDocumentTotalsResult {
  items: CateringDocumentItem[];
  totals: CateringDocumentTotals;
}

export function calculateDocumentTotals(
  items: CateringDocumentItem[],
  discount: number = 0
): CalculatedDocumentTotalsResult {
  const normalizedItems = items.map((item) => {
    const days = Number(item.days) || 0;
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;

    const totalPrice = days * quantity * unitPrice;

    return {
      ...item,
      days,
      quantity,
      unitPrice,
      totalPrice,
    };
  });

  const subtotal = normalizedItems.reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );

  const safeDiscount = Math.max(Number(discount) || 0, 0);
  const total = Math.max(subtotal - safeDiscount, 0);

  return {
    items: normalizedItems,
    totals: {
      subtotal,
      discount: safeDiscount,
      total,
      currency: "USD",
    },
  };
}