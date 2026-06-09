// src/utils/buildDocumentItemsFromSimulation.ts
import { CateringSimulation } from "@/types/catering";
import { CateringDocumentItem } from "@/types/documents";

export function buildDocumentItemsFromSimulation(
  simulation: CateringSimulation
): CateringDocumentItem[] {
  return (simulation.sections ?? [])
    .filter((section) => section.enabled)
    .map((section) => {
      const days = Number(section.numberOfDays ?? 1);
      const quantity = Number(section.quantity ?? 0);
      const unitPrice = Number(section.unitPrice ?? 0);
      const totalPrice = Number(section.total ?? days * quantity * unitPrice);

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