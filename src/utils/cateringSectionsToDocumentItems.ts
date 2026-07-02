// src/utils/cateringSectionsToDocumentItems.ts

import { CateringSection } from "@/types/catering";
import { CateringDocumentItem } from "@/types/documents";

function toNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function safeDays(value: unknown): number {
  const days = toNumber(value, 1);
  return days > 0 ? days : 1;
}

export function sectionsToDocumentItems(
  sections: CateringSection[]
): CateringDocumentItem[] {
  return (sections ?? [])
    .filter((section) => section.enabled)
    .map((section) => {
      const isService =
        section.kind === "service" || section.type === "service";

      if (isService && section.serviceMode === "different_days") {
        const totalPrice = toNumber(section.total);

        return {
          label: "Forfait Service traiteur",
          days: 1,
          quantity: 1,
          unitPrice: totalPrice,
          totalPrice,
        };
      }

      if (isService) {
        const days = safeDays(section.numberOfDays);
        const unitPrice = toNumber(section.unitPrice);
        const totalPrice = toNumber(section.total, days * unitPrice);

        return {
          label: "Service traiteur",
          days,
          quantity: 1,
          unitPrice,
          totalPrice,
        };
      }

      const quantity = toNumber(section.quantity);
      const unitPrice = toNumber(section.unitPrice);
      const days = safeDays(section.numberOfDays);
      const billingMode = section.billingMode ?? "perDay";

      const multiplier = billingMode === "fixed" ? 1 : days;

      const totalPrice = toNumber(
        section.total,
        quantity * unitPrice * multiplier
      );

      return {
        label: section.name,
        days: billingMode === "fixed" ? 0 : days,
        quantity,
        unitPrice,
        totalPrice,
      };
    })
    .filter((item) => {
      const totalPrice = Number(item.totalPrice ?? 0);
      return item.quantity > 0 && totalPrice !== 0;
    });
}

export function buildDocumentTotalsFromSections(
  sections: CateringSection[],
  discount = 0
) {
  const items = sectionsToDocumentItems(sections);

  const subtotal = items.reduce(
    (sum, item) => sum + toNumber(item.totalPrice),
    0
  );

  const discountAmount = subtotal * (toNumber(discount) / 100);
  const total = Math.max(subtotal - discountAmount, 0);

  return {
    subtotal,
    discount,
    discountAmount,
    tax: 0,
    totalAfterDiscount: total,
    total,
    currency: "USD",
  };
}