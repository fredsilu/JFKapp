import {
  CateringMealInput,
  CateringMealResult,
  CateringServiceInput,
  CateringServiceCosts,
  CateringServiceResult,
  CateringSimulationDraft ,
  CateringSimulationResult,
} from '@/types/catering';

/**
 * =========================
 * CALCUL COMMUN
 * Petit-déjeuner / Déjeuner / Boissons
 * =========================
 */
export function calculateMeal(
  input: CateringMealInput
): CateringMealResult {
  const dailyFoodCost =
    input.numberOfPeople *
    input.unitPrice *
    (input.foodCostRate / 100);

  const totalDailyFoodCost = dailyFoodCost;

  const totalFoodCost =
    dailyFoodCost * input.numberOfDays;

  const turnover =
    input.numberOfPeople *
    input.unitPrice *
    input.numberOfDays -
    input.discount;

  return {
    dailyFoodCost,
    totalDailyFoodCost,
    totalFoodCost,
    turnover,
  };
}

/**
 * =========================
 * CALCUL SERVICE
 * =========================
 */
export function calculateService(
  input: CateringServiceInput,
  costs: CateringServiceCosts
): CateringServiceResult {
  const numberOfServers = Math.ceil(
    input.numberOfPeople / input.serverRate
  );

  const numberOfCooks = Math.ceil(
    input.numberOfPeople / input.cookRate
  );

  const serverCost = numberOfServers * costs.serverDailyCost;
  const cookCost = numberOfCooks * costs.cookDailyCost;

  const electricityCost = costs.electricityDailyCost;
  const gasCost = costs.gasDailyCost;
  const fuelCost = costs.fuelDailyCost;

  const dailyServiceCost =
    serverCost +
    cookCost +
    electricityCost +
    gasCost +
    fuelCost;

  const totalServiceCost =
    dailyServiceCost * input.numberOfDays -
    input.discount;

  return {
    numberOfServers,
    numberOfCooks,
    serverCost,
    cookCost,
    electricityCost,
    gasCost,
    fuelCost,
    dailyServiceCost,
    totalServiceCost,
  };
}

/**
 * =========================
 * CALCUL GLOBAL DE SIMULATION
 * =========================
 */
export function calculateSimulation(
  simulation: CateringSimulationDraft
): CateringSimulationResult {
  let globalTurnover = 0;
  let globalCost = 0;

  const result: CateringSimulationResult = {
    globalTurnover: 0,
    globalCost: 0,
    globalMargin: 0,
  };

  if (simulation.breakfast.enabled) {
    const breakfast = calculateMeal(simulation.breakfast);
    result.breakfast = breakfast;
    globalTurnover += breakfast.turnover;
    globalCost += breakfast.totalFoodCost;
  }

  if (simulation.lunch.enabled) {
    const lunch = calculateMeal(simulation.lunch);
    result.lunch = lunch;
    globalTurnover += lunch.turnover;
    globalCost += lunch.totalFoodCost;
  }

  if (simulation.drinks.enabled) {
    const drinks = calculateMeal(simulation.drinks);
    result.drinks = drinks;
    globalTurnover += drinks.turnover;
    globalCost += drinks.totalFoodCost;
  }

  if (simulation.service.enabled) {
    const service = calculateService(
      simulation.service,
      simulation.serviceCosts
    );
    result.service = service;
    globalCost += service.totalServiceCost;
  }

  result.globalTurnover = globalTurnover;
  result.globalCost = globalCost;
  result.globalMargin = globalTurnover - globalCost;

  return result;
}
