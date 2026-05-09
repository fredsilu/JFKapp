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

  dailyServiceCost: number;
  totalServiceCost: number;
};

export type CateringSimulationResult = {
  breakfast: MealResult | null;
  lunch: MealResult | null;
  drinks: MealResult | null;
  service: ServiceResult | null;

  globalTurnover: number;
  globalCost: number;
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

/* =========================
   MEALS
========================= */

function calculateMeal(meal?: CateringMealInput): MealResult | null {
  if (!meal?.enabled) return null;

  const numberOfPeople = toNumber(meal.numberOfPeople);
  const unitPrice = toNumber(meal.unitPrice);
  const numberOfDays = safeDays(meal.numberOfDays);
  const foodCostRate = toNumber(meal.foodCostRate);
  const discount = toNumber((meal as any).discount);

  if (numberOfPeople <= 0 || unitPrice <= 0) return null;

  const dailyTurnover = Math.max(
    numberOfPeople * unitPrice - discount,
    0
  );

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

  const discount = toNumber((service as any).discount);

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

  const dailyServiceCost = Math.max(
    serversCost +
      cooksCost +
      electricityCost +
      gasCost +
      fuelCost -
      discount,
    0
  );

  const totalServiceCost = dailyServiceCost * numberOfDays;

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

  const globalTurnover =
    toNumber(breakfast?.totalTurnover) +
    toNumber(lunch?.totalTurnover) +
    toNumber(drinks?.totalTurnover);

  const globalCost =
    toNumber(breakfast?.totalFoodCost) +
    toNumber(lunch?.totalFoodCost) +
    toNumber(drinks?.totalFoodCost) +
    toNumber(service?.totalServiceCost);

  const globalMargin = globalTurnover - globalCost;

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