// src/utils/cateringSectionsToDocumentItems.ts

import { CateringSection } from "@/types/catering";
import { CateringDocumentItem } from "@/types/documents";

export function sectionsToDocumentItems(
  sections: CateringSection[]
): CateringDocumentItem[] {
  return (sections ?? [])
    .filter((section) => section.enabled)
    .map((section) => {
      const isService =
        section.kind === "service" || section.type === "service";

      if (isService && section.serviceMode === "different_days") {
        const totalPrice = Number(section.total ?? 0);

        return {
          label: "Forfait Service traiteur",
          days: 1,
          quantity: 1,
          unitPrice: totalPrice,
          totalPrice,
        };
      }

      if (isService) {
        const days = Number(section.numberOfDays ?? 1);
        const unitPrice = Number(section.unitPrice ?? 0);
        const totalPrice = Number(section.total ?? days * unitPrice);

        return {
          label: "Service traiteur",
          days,
          quantity: 1,
          unitPrice,
          totalPrice,
        };
      }

      const quantity = Number(section.quantity ?? 0);
      const unitPrice = Number(section.unitPrice ?? 0);
      const days = Number(section.numberOfDays ?? 1);
      const totalPrice = Number(section.total ?? quantity * unitPrice * days);

      return {
        label: section.name,
        days,
        quantity,
        unitPrice,
        totalPrice,
      };
    })
    .filter((item) => item.quantity > 0 && item.unitPrice > 0);
}

export function buildDocumentTotalsFromSections(
  sections: CateringSection[],
  discount = 0
) {
  const items = sectionsToDocumentItems(sections);

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.totalPrice ?? 0),
    0
  );

  const discountAmount = subtotal * (Number(discount ?? 0) / 100);
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