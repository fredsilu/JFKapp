import { Timestamp } from 'firebase/firestore';

/**
 * =========================
 * INPUTS MÉTIER
 * =========================
 */
export interface CateringMealInput {
  enabled: boolean;
  numberOfPeople: number;
  unitPrice: number;        // $ / personne / jour
  numberOfDays: number;
  discount: number;         // $
  foodCostRate: number;     // %
}

export interface CateringMealResult {
  dailyFoodCost: number;
  totalDailyFoodCost: number;
  totalFoodCost: number;
  turnover: number;
}

export interface CateringServiceInput {
  enabled: boolean;
  numberOfPeople: number;
  numberOfDays: number;
  discount: number;

  serverRate: number;   // 1 serveur pour X personnes
  cookRate: number;     // 1 cuisinier pour X personnes
}

export interface CateringServiceCosts {
  serverDailyCost: number;
  cookDailyCost: number;
  electricityDailyCost: number;
  gasDailyCost: number;
  fuelDailyCost: number;
}

export interface CateringServiceResult {
  numberOfServers: number;
  numberOfCooks: number;

  serverCost: number;
  cookCost: number;
  electricityCost: number;
  gasCost: number;
  fuelCost: number;

  dailyServiceCost: number;
  totalServiceCost: number;
}

/**
 * =========================
 * SIMULATION – DRAFT (UI / CALCUL)
 * =========================
 */
export interface CateringSimulationDraft {
  breakfast: CateringMealInput;
  lunch: CateringMealInput;
  drinks: CateringMealInput;
  service: CateringServiceInput;

  serviceCosts: CateringServiceCosts;

  // infos optionnelles côté UI
  name?: string;
  clientId?: string;

  // ✅ AJOUT IMPORTANT
  dateLivraison: string;
}

/**
 * =========================
 * RÉSULTAT DE SIMULATION
 * =========================
 */
export interface CateringSimulationResult {
  breakfast?: CateringMealResult;
  lunch?: CateringMealResult;
  drinks?: CateringMealResult;
  service?: CateringServiceResult;

  globalTurnover: number;
  globalCost: number;
  globalMargin: number;
}

/**
 * =========================
 * SIMULATION PERSISTÉE (FIRESTORE)
 * =========================
 */
export type CateringSimulation =
  CateringSimulationDraft & {
    id: string;

    // Champs obligatoires en base
    name: string;
    clientId: string;

    createdAt: Timestamp;
    updatedAt: Timestamp;
    isDeleted: boolean;

    dateLivraison: string;  // OK ici aussi

    status: 'draft' | 'validated';
    convertedToOrder?: boolean;
    orderId?: string;
    convertedAt?: string;

  }
export type CateringOrder = {
  id: string;
  simulationId: string;

  name: string;
  clientId: string;
  dateLivraison: string;

  breakfast?: CateringMealInput;
  lunch?: CateringMealInput;
  drinks?: CateringMealInput;
  service?: CateringServiceInput;

  // 🔵 Prix final (modifiable)
  totals?: {
    totalHT: number;
    totalCost: number;
    margin: number;
  };

  // 🆕 Prix d'origine de la simulation (référence)
  pricingReference?: {
    totalHT: number;
    totalCost: number;
    margin: number;
  };

  lieu?: string;
  heureLivraison?: string;
  contactSurSite?: string;
  telephoneContact?: string;
  instructions?: string;

  status: 'draft' | 'confirmed' | 'in-production' | 'delivered';

  createdAt: string;
};

export type CateringOrderStatus =
  | 'draft'
  | 'confirmed'
  | 'in-production'
  | 'delivered';

export type MoneyTotals = {
  totalHT: number;
  totalCost: number;
  margin: number;
};





