//src/utils/cateringCalculations.ts
import {
  CateringSimulationDraft,
  CateringMealInput,
  CateringServiceInput,
} from '@/types/catering';

/* =========================
   TYPES RÉSULTATS
========================= */

type MealResult = {
  recap: CateringMealInput;
  dailyTurnover: number;
  totalTurnover: number;
  dailyFoodCost: number;
  totalFoodCost: number;
};

type ServiceResult = {
  recap: CateringServiceInput;
  numberOfServers: number;
  numberOfCooks: number;

  electricityCost: number;
  gasCost: number;
  fuelCost: number;
  serversCost: number;
  cooksCost: number;

  // Coût réel du service
  dailyServiceCost: number;
  totalServiceCost: number;

  // Prix facturé client
  serviceUnitPrice: number;
  totalServiceTurnover: number;
};

export type CateringSimulationResult = {
  breakfast: MealResult | null;
  lunch: MealResult | null;
  drinks: MealResult | null;
  service: ServiceResult | null;

  // CA brut avant remise
  globalTurnover: number;

  // Coûts réels : matières + service réel
  globalCost: number;

  // Marge = CA brut - remise - coûts réels
  globalMargin: number;
};

/* =========================
   HELPERS
========================= */

function toNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function safeDays(value: unknown): number {
  const days = toNumber(value, 1);
  return days > 0 ? days : 1;
}

/**
 * Prix facturé du service à partir du coût réel journalier.
 *
 * Exemples :
 * coût 80  => prix facturé 100
 * coût 120 => prix facturé 150
 * coût 180 => prix facturé 200
 * coût 230 => prix facturé 250
 */
function calculateServiceUnitPriceFromCost(cost: number): number {
  if (cost <= 0) return 0;

  if (cost < 100) {
    return 100;
  }

  return Math.ceil(cost / 50) * 50;
}

/* =========================
   MEALS
========================= */

function calculateMeal(meal?: CateringMealInput): MealResult | null {
  if (!meal?.enabled) return null;

  const numberOfPeople = toNumber(meal.numberOfPeople);
  const unitPrice = toNumber(meal.unitPrice);
  const numberOfDays = safeDays(meal.numberOfDays);
  const foodCostRate = toNumber(meal.foodCostRate);

  if (numberOfPeople <= 0 || unitPrice <= 0) return null;

  const dailyTurnover = numberOfPeople * unitPrice;
  const totalTurnover = dailyTurnover * numberOfDays;

  const dailyFoodCost = dailyTurnover * (foodCostRate / 100);
  const totalFoodCost = dailyFoodCost * numberOfDays;

  return {
    recap: {
      ...meal,
      numberOfPeople,
      unitPrice,
      numberOfDays,
      foodCostRate,
    },
    dailyTurnover,
    totalTurnover,
    dailyFoodCost,
    totalFoodCost,
  };
}

/* =========================
   SERVICE
========================= */

function calculateService(
  service?: CateringServiceInput,
  costs?: CateringSimulationDraft['serviceCosts']
): ServiceResult | null {
  if (!service?.enabled) return null;

  const numberOfPeople = toNumber(service.numberOfPeople);
  const numberOfDays = safeDays(service.numberOfDays);

  const serverRate = toNumber(service.serverRate, 25);
  const cookRate = toNumber(service.cookRate, 50);

  const serverDailyCost = toNumber(costs?.serverDailyCost);
  const cookDailyCost = toNumber(costs?.cookDailyCost);
  const electricityDailyCost = toNumber(costs?.electricityDailyCost);
  const gasDailyCost = toNumber(costs?.gasDailyCost);
  const fuelDailyCost = toNumber(costs?.fuelDailyCost);

  if (numberOfPeople <= 0) return null;

  const numberOfServers =
    serverRate > 0 ? Math.ceil(numberOfPeople / serverRate) : 0;

  const numberOfCooks =
    cookRate > 0 ? Math.ceil(numberOfPeople / cookRate) : 0;

  const serversCost = numberOfServers * serverDailyCost;
  const cooksCost = numberOfCooks * cookDailyCost;

  const electricityCost = electricityDailyCost;
  const gasCost = gasDailyCost;
  const fuelCost = fuelDailyCost;

  /**
   * Coût réel journalier du service
   */
  const dailyServiceCost = Math.max(
    serversCost +
      cooksCost +
      electricityCost +
      gasCost +
      fuelCost,
    0
  );

  /**
   * Coût réel total du service
   */
  const totalServiceCost = dailyServiceCost * numberOfDays;

  /**
   * Prix unitaire facturé au client par jour
   * basé sur le palier commercial.
   */
  const serviceUnitPrice =
    calculateServiceUnitPriceFromCost(dailyServiceCost);

  /**
   * Chiffre d'affaires total du service
   */
  const totalServiceTurnover =
    serviceUnitPrice * numberOfDays;

  return {
    recap: {
      ...service,
      numberOfPeople,
      numberOfDays,
      serverRate,
      cookRate,
    },
    numberOfServers,
    numberOfCooks,

    electricityCost,
    gasCost,
    fuelCost,
    serversCost,
    cooksCost,

    dailyServiceCost,
    totalServiceCost,

    serviceUnitPrice,
    totalServiceTurnover,
  };
}

/* =========================
   MAIN CALCULATOR
========================= */

export function calculateSimulation(
  simulation: CateringSimulationDraft
): CateringSimulationResult {
  const breakfast = calculateMeal(simulation.breakfast);
  const lunch = calculateMeal(simulation.lunch);
  const drinks = calculateMeal(simulation.drinks);

  const service = calculateService(
    simulation.service,
    simulation.serviceCosts
  );

  /**
   * CA repas avant remise
   */
  const mealsTurnover =
    toNumber(breakfast?.totalTurnover) +
    toNumber(lunch?.totalTurnover) +
    toNumber(drinks?.totalTurnover);

  /**
   * CA service facturé selon palier commercial
   */
  const serviceTurnover =
    toNumber(service?.totalServiceTurnover);

  /**
   * CA brut total avant remise
   */
  const globalTurnover =
    mealsTurnover + serviceTurnover;

  /**
   * Coûts réels :
   * - coût matière repas
   * - coût réel service
   */
  const globalCost =
    toNumber(breakfast?.totalFoodCost) +
    toNumber(lunch?.totalFoodCost) +
    toNumber(drinks?.totalFoodCost) +
    toNumber(service?.totalServiceCost);

  /**
   * Remise globale commerciale
   */
  const globalDiscount =
    toNumber(simulation.discount);

  /**
   * CA net après remise
   */
  const netTurnover =
    Math.max(globalTurnover - globalDiscount, 0);

  /**
   * Marge finale
   */
  const globalMargin =
    netTurnover - globalCost;

  return {
    breakfast,
    lunch,
    drinks,
    service,
    globalTurnover,
    globalCost,
    globalMargin,
  };
}