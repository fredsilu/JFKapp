import {
  CateringSimulation,
  CateringDocumentItem
} from "@/types/catering";

export function buildDocumentItemsFromSimulation(
  simulation: CateringSimulation
): CateringDocumentItem[] {

  const items: CateringDocumentItem[] = [];

  /**
   * BREAKFAST
   */
  if (simulation.breakfast?.enabled) {

    const days = simulation.breakfast.numberOfDays;
    const quantity = simulation.breakfast.numberOfPeople;
    const price = simulation.breakfast.unitPrice;

    items.push({
      label: simulation.breakfast.name ?? "Petit déjeuner",
      days,
      quantity,
      unitPrice: price,
      totalPrice: days * quantity * price
    });

  }

  /**
   * LUNCH
   */
  if (simulation.lunch?.enabled) {

    const days = simulation.lunch.numberOfDays;
    const quantity = simulation.lunch.numberOfPeople;
    const price = simulation.lunch.unitPrice;

    items.push({
      label: simulation.lunch.name ?? "Déjeuner",
      days,
      quantity,
      unitPrice: price,
      totalPrice: days * quantity * price
    });

  }

  /**
   * DRINKS
   */
  if (simulation.drinks?.enabled) {

    const days = simulation.drinks.numberOfDays;
    const quantity = simulation.drinks.numberOfPeople;
    const price = simulation.drinks.unitPrice;

    items.push({
      label: simulation.drinks.name ?? "Boissons",
      days,
      quantity,
      unitPrice: price,
      totalPrice: days * quantity * price
    });

  }

  /**
   * SERVICE
   */
  if (simulation.service?.enabled) {

    const days = simulation.service.numberOfDays;

    const servicePrice =
      (simulation.service.serverRate ?? 0) +
      (simulation.service.cookRate ?? 0);

    items.push({
      label: "Service traiteur",
      days,
      quantity: 1,
      unitPrice: servicePrice,
      totalPrice: servicePrice * days
    });

  }

  return items;
}