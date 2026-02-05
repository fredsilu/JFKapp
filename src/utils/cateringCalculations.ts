import {
  CateringSimulationDraft,
  CateringMealInput,
  CateringServiceInput,
} from '@/types/catering';

/* =========================
   TYPES RESULTATS
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

function calculateMeal(meal: CateringMealInput): MealResult | null {
  if (!meal.enabled || meal.numberOfPeople <= 0 || meal.unitPrice <= 0) {
    return null;
  }

  const dailyTurnover =
    meal.numberOfPeople * meal.unitPrice - meal.discount;

  const totalTurnover = dailyTurnover * meal.numberOfDays;

  const dailyFoodCost =
    dailyTurnover * (meal.foodCostRate / 100);

  const totalFoodCost =
    dailyFoodCost * meal.numberOfDays;

  return {
    recap: meal,
    dailyTurnover,
    totalTurnover,
    dailyFoodCost,
    totalFoodCost,
  };
}

function calculateService(
  service: CateringServiceInput,
  costs: {
    serverDailyCost: number;
    cookDailyCost: number;
    electricityDailyCost: number;
    gasDailyCost: number;
    fuelDailyCost: number;
  }
): ServiceResult | null {
  if (!service.enabled || service.numberOfPeople <= 0) {
    return null;
  }

  const numberOfServers = Math.ceil(
    service.numberOfPeople / service.serverRate
  );

  const numberOfCooks = Math.ceil(
    service.numberOfPeople / service.cookRate
  );

  const serversCost =
    numberOfServers * costs.serverDailyCost;

  const cooksCost =
    numberOfCooks * costs.cookDailyCost;

  const electricityCost = costs.electricityDailyCost;
  const gasCost = costs.gasDailyCost;
  const fuelCost = costs.fuelDailyCost;

  const dailyServiceCost =
    serversCost +
    cooksCost +
    electricityCost +
    gasCost +
    fuelCost -
    service.discount;

  const totalServiceCost =
    dailyServiceCost * service.numberOfDays;

  return {
    recap: service,
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
    (breakfast?.totalTurnover || 0) +
    (lunch?.totalTurnover || 0) +
    (drinks?.totalTurnover || 0);

  const globalCost =
    (breakfast?.totalFoodCost || 0) +
    (lunch?.totalFoodCost || 0) +
    (drinks?.totalFoodCost || 0) +
    (service?.totalServiceCost || 0);

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
