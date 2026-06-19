//types/catering.ts
import { Timestamp } from "firebase/firestore";
import {
  CateringDocumentItem,
  CateringDocumentTotals,
} from "@/types/documents";
import { Dish } from ".";

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

export type EditableOrderItem = {
  id?: string;
  label: string;
  name?: string;
  quantity: number;
  numberOfDays?: number;
  unitPrice?: number;
  total?: number;
  dish?: Dish;
};

/**
 * =========================
 * RUBRIQUES DYNAMIQUES
 * =========================
 */

export type CateringSectionType =
  | "food"
  | "drink"
  | "service"
  | "logistics"
  | "custom";

export interface CateringSectionTemplate {
  id?: string;
  key: string;
  name: string;
  type: CateringSectionType;
  position: number;
  isActive: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type CateringSectionKind = "article" | "service";

export type CateringServiceMode =
  | "identical_days"
  | "different_days";

export interface CateringServiceDay {
  id: string;
  dayNumber: number;

  numberOfPeople: number;

  serverRate: number;
  cookRate: number;

  numberOfServers: number;
  numberOfCooks: number;

  serverDailyCost: number;
  cookDailyCost: number;

  electricityDailyCost?: number;
  gasDailyCost?: number;
  fuelDailyCost?: number;

  extraDailyCost?: number;

  totalCost: number;
  billedAmount: number;
}
export interface CateringSection {
  id: string;
  key?: string;

  kind: CateringSectionKind;

  name: string;
  type: CateringSectionType;
  position: number;

  enabled: boolean;

  /**
   * Ligne commerciale simple
   */
  quantity: number;
  unitPrice: number;
  numberOfDays: number;

  total: number;

  costRate?: number;
  costAmount?: number;
  margin?: number;

  /**
   * Service traiteur avancé
   */
  serviceMode?: CateringServiceMode;
  serviceDays?: CateringServiceDay[];

  notes?: string;
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
  sections?: CateringSection[];

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
  totals?: {
    subtotal: number;
    discountAmount?: number;
    grandTotal?: number;
    totalCost: number;
    margin: number;
  };
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


export interface CateringDocumentClient {
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  notes?: string;
  rccm?: string;
  idNat?: string;
  nif?: string;
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
  eventName?: string;

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

  sections?: CateringSection[];

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
  | "partial"
  | "paid"
  | "replaced"
  | "cancelled";

export type CateringInvoiceDocumentType =
  | "INVOICE"
  | "CREDIT_NOTE";

export type CateringInvoiceCorrectionType =
  | null
  | "ANNULLE_ET_REMPLACE"
  | "CREDIT_NOTE";

export type CateringInvoiceHistoryType =
  | "CREATED"
  | "UPDATED"
  | "ISSUED"
  | "CANCELLED"
  | "REPLACED"
  | "CREDIT_NOTE_CREATED"
  | "PAYMENT_ADDED"
  | "PDF_GENERATED"
  | "SENT_TO_CLIENT";

export interface CateringInvoiceCancellation {
  cancelledAt?: Timestamp | null;
  cancelledBy?: string | null;
  reason?: string;
}

export interface CateringInvoiceCorrection {
  correctionType: CateringInvoiceCorrectionType;

  replacesInvoiceId?: string | null;
  replacesInvoiceNumber?: string | null;

  replacedByInvoiceId?: string | null;
  replacedByInvoiceNumber?: string | null;

  relatedInvoiceId?: string | null;
  relatedInvoiceNumber?: string | null;

  reason?: string | null;
}

export interface CateringInvoiceHistory {
  id?: string;
  invoiceId: string;
  type: CateringInvoiceHistoryType;
  message: string;
  createdAt: Timestamp;
  createdBy?: string | null;
  snapshot?: Partial<CateringInvoice>;
}



export type CateringInvoice = {
  id?: string;

  /**
   * Type de document comptable
   * INVOICE = facture normale
   * CREDIT_NOTE = facture d'avoir
   */
  documentType: CateringInvoiceDocumentType;

  /**
   * Références commerciales liées à la facture
   */
  orderId?: string | null;
  orderNumber?: string;

  proformaId?: string | null;
  proformaNumber?: string;

  sourceProformaId?: string | null;
  sourceProformaNumber?: string;



  /**
   * Numéro officiel de la facture.
   * Ne doit jamais être modifié après émission.
   */
  number: string;

  /**
   * Statut métier de la facture.
   * Seul "draft" est modifiable.
   */
  status: CateringInvoiceStatus;

  clientId: string;
  client: CateringDocumentClient;

  designation: string;

  dateLivraison: string;
  deliveryTime?: string;
  deliveryAddress?: string;
  eventName?: string;

  eventDate?: string;

  guestCount?: number;

  comment?: string;

  /**
   * Snapshot commercial figé au moment de l’émission.
   */
  items: CateringDocumentItem[];
  totals: CateringDocumentTotals;

  sections?: CateringSection[];

  /**
   * Correction comptable :
   * - Annule et remplace
   * - Facture d’avoir
   */
  correction?: CateringInvoiceCorrection;

  /**
   * Informations d’annulation éventuelle.
   */
  cancellation?: CateringInvoiceCancellation | null;
  creditNoteSummary?: CateringInvoiceCreditNoteSummary;

  createdAt: Timestamp;
  updatedAt: Timestamp;

  issuedAt?: Timestamp | null;

  createdBy?: string | null;
  issuedBy?: string | null;

  /**
   * Version interne du modèle de facture.
   */
  version?: number;

  /**
   * Conservé temporairement pour compatibilité Firestore/UI.
   * La vraie règle métier reste dérivée du status via isCateringInvoiceLocked().
   */
  isLocked?: boolean;
};

export function isCateringInvoiceLocked(
  invoice: CateringInvoice
): boolean {
  return invoice.status !== "draft";
}

/**
 * =========================
 * MONEY UTILS
 * =========================
 */

export type MoneyTotals = {
  totalHT: number;
  discountAmount?: number;
  grandTotal?: number;
  totalCost: number;
  margin: number;
};

export type CateringInvoiceCreditNoteSummary = {
  totalCredited: number;
  remainingCreditableAmount: number;
  lastCreditNoteId?: string | null;
  lastCreditNoteNumber?: string | null;
  lastCreditNoteAmount?: number;
  lastCreditNoteAt?: Timestamp | null;
  isFullyCredited: boolean;
};

