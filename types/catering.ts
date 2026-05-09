import { Timestamp } from "firebase/firestore";

/**
 * =========================
 * INPUTS MÉTIER
 * =========================
 */

export interface CateringMealInput {
  enabled: boolean;
  numberOfPeople: number;
  unitPrice: number; // $ / personne / jour
  numberOfDays: number;
  foodCostRate: number; // %
  name?: string; // utile pour documents
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


  serverRate: number;
  cookRate: number;

  serviceMarginRate: number; // %
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

  // infos UI
  name?: string;
  clientId?: string;
  discount?: number;

  dateLivraison: string;


  // infos commerciales
  designation?: string;
  guestCount?: number;
  deliveryAddress?: string;
  deliveryTime?: string;
  comment?: string;
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
 * SIMULATION PERSISTÉE
 * =========================
 */

export type CateringSimulation = CateringSimulationDraft & {
  id: string;

  name: string;
  clientId: string;
  discount?: number;

  globalTurnover?: number;
  globalCost?: number;
  globalMargin?: number;

  createdAt: Timestamp;
  updatedAt: Timestamp;

  isDeleted: boolean;

  status: "draft" | "validated";

  convertedToOrder?: boolean;
  orderId?: string;
  convertedAt?: string;
};

/**
 * =========================
 * DOCUMENTS COMMERCIAUX
 * =========================
 */

export type CateringDocumentType = "proforma" | "invoice";

export interface CateringDocumentItem {
  label: string;
  days: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CateringDocumentTotals {
  subtotal: number;
  total: number;
  currency: "USD" | "CDF";
}

export interface CateringDocumentClient {
  name: string;
  address?: string;
  cityCountry?: string;
  phone?: string;
  notes?: string;
  rccm?: string;
  idNat?: string;
}

/**
 * =========================
 * ORDER / PROFORMA
 * =========================
 */

export type CateringOrderStatus =
  | "draft"
  | "sent"
  | "confirmed"
  | "in-production"
  | "delivered"
  | "cancelled";

export type CateringOrderDocumentType =
  | "proforma"
  | "order";

export type CateringOrder = {
  id: string;

  simulationId: string | null;

  documentType: CateringOrderDocumentType;
  status: CateringOrderStatus;

  number: string;
  version: number;

  name: string;

  clientId: string;
  client: CateringDocumentClient;

  designation: string;

  dateLivraison: string;
  deliveryTime?: string;
  deliveryAddress?: string;

  guestCount?: number;

  comment?: string;

  /**
   * Snapshot commercial figé
   */
  items: CateringDocumentItem[];
  totals: CateringDocumentTotals;

  /**
   * Snapshot technique (facultatif)
   */
  breakfast?: CateringMealInput;
  lunch?: CateringMealInput;
  drinks?: CateringMealInput;
  service?: CateringServiceInput;

  /**
   * référence pricing simulation
   */
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

  invoiceId?: string | null;

  createdAt: Timestamp;
  updatedAt: Timestamp;

  confirmedAt?: Timestamp | null;
};

/**
 * =========================
 * FACTURE
 * =========================
 */

export type CateringInvoiceStatus =
  | "draft"
  | "issued"
  | "paid"
  | "cancelled";

export type CateringInvoice = {
  id: string;

  orderId: string;
  sourceProformaId?: string | null;

  number: string;

  status: CateringInvoiceStatus;

  clientId: string;
  client: CateringDocumentClient;

  designation: string;

  dateLivraison: string;
  deliveryTime?: string;
  deliveryAddress?: string;

  guestCount?: number;

  comment?: string;

  items: CateringDocumentItem[];
  totals: CateringDocumentTotals;

  createdAt: Timestamp;
  updatedAt: Timestamp;

  issuedAt?: Timestamp | null;
};

/**
 * =========================
 * MONEY UTILS
 * =========================
 */

export type MoneyTotals = {
  totalHT: number;
  totalCost: number;
  margin: number;
};