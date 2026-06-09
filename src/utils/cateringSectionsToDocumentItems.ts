// src/utils/cateringSectionsToDocumentItems.ts

import { CateringSection } from "@/types/catering";
import { CateringDocumentItem } from "@/types/documents";

export function sectionsToDocumentItems(
  sections: CateringSection[]
): CateringDocumentItem[] {
  return (sections ?? [])
    .filter((section) => section.enabled)
    .map((section) => {
      const quantity = Number(section.quantity ?? 0);
      const unitPrice = Number(section.unitPrice ?? 0);
      const days = Number(section.numberOfDays ?? 1);

      const totalPrice =
        Number(section.total ?? quantity * unitPrice * days);

      return {
        label: section.name,
        days,
        quantity,
        unitPrice,
        totalPrice,
      };
    });
}

export function buildDocumentTotalsFromSections(
  sections: CateringSection[],
  discount = 0
) {
  const subtotal = (sections ?? [])
    .filter((section) => section.enabled)
    .reduce((sum, section) => {
      const quantity = Number(section.quantity ?? 0);
      const unitPrice = Number(section.unitPrice ?? 0);
      const days = Number(section.numberOfDays ?? 1);
      const total = Number(section.total ?? quantity * unitPrice * days);

      return sum + total;
    }, 0);

  const discountAmount = subtotal * (Number(discount ?? 0) / 100);
  const total = Math.max(subtotal - discountAmount, 0);

  return {
    subtotal,
    discount,
    total,
    currency: "USD",
  };
}