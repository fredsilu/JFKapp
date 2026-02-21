interface SimulationInput {
  currentTreasury: number;
  projectedIncome: number;
  projectedExpense: number;
  simulatedOutflow?: number;
}

export function simulateProjection(input: SimulationInput) {
  const {
    currentTreasury,
    projectedIncome,
    projectedExpense,
    simulatedOutflow = 0,
  } = input;

  const projectedTreasury =
    currentTreasury +
    projectedIncome -
    projectedExpense -
    simulatedOutflow;

  let risk: "LOW" | "MEDIUM" | "HIGH";

  if (projectedTreasury < 0) {
    risk = "HIGH";
  } else if (projectedTreasury < currentTreasury * 0.2) {
    risk = "MEDIUM";
  } else {
    risk = "LOW";
  }

  return {
    projectedTreasury,
    risk,
  };
}