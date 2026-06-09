// src/utils/buildDocumentItemsFromSimulation.ts
import { CateringSimulation } from "@/types/catering";
import { CateringDocumentItem } from "@/types/documents";

export function buildDocumentItemsFromSimulation(
  simulation: CateringSimulation
): CateringDocumentItem[] {
  return (simulation.sections ?? [])
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