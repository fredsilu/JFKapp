/* ============================= */
/*         ENUMS & TYPES         */
/* ============================= */

export type EntityType = "maison" | "crepolia";

export type CurrencyType = "USD" | "CDF";

export type TransactionType =
  | "income"
  | "expense"
  | "internal_transfer";

export type AccountType =
  | "cash"
  | "bank"
  | "mobile";

/* ============================= */
/*           ACCOUNTS            */
/* ============================= */

export interface Account {
  id: string;
  entity: EntityType;

  name: string;
  type: AccountType;

  currency: CurrencyType;

  initialBalance: number;
  currentBalance?: number;

  createdAt: Date;
  updatedAt?: Date;
}

/* ============================= */
/*         TRANSACTIONS          */
/* ============================= */

export interface Transaction {
  id: string;

  entity: EntityType;
  type: TransactionType;

  amount: number;
  currency: CurrencyType;

  date: Date;

  accountId: string;

  category: string;
  description?: string;

  // Lien prévisionnel (optionnel)
  forecastId?: string;

  // Gestion transfert interne
  isInternalTransfer?: boolean;
  transferId?: string;
  internalTargetEntity?: EntityType;

  createdAt: Date;
  updatedAt?: Date;
}

/* ============================= */
/*         FORECAST (PREV)       */
/* ============================= */

export interface Forecast {
  id: string;

  entity: EntityType;

  type: "income" | "expense";

  amount: number;
  currency: CurrencyType;

  plannedDate: Date;

  category: string;
  description?: string;

  createdAt: Date;
  updatedAt?: Date;
}

/* ============================= */
/*      DASHBOARD MODELS         */
/* ============================= */

export interface PeriodFilter {
  startDate: Date;
  endDate: Date;
  currency?: CurrencyType;
  entity?: EntityType;
}

export interface EntityDashboardSummary {
  totalIncome: number;
  totalExpense: number;
  netResult: number;

  totalCash: number;
  totalBank: number;
  totalMobile: number;
  totalTreasury: number;

  forecastIncome: number;
  forecastExpense: number;
  forecastGap: number;

  dividend?: number;
  dividendRate?: number;
}

export interface GroupDashboardSummary {
  totalIncome: number;
  totalExpense: number;
  netResult: number;

  totalTreasury: number;

  totalCash: number;
  totalBank: number;
  totalMobile: number;

  forecastGap: number;
}

/* ============================= */
/*       INTERNAL TRANSFER       */
/* ============================= */

export interface InternalTransferInput {
  sourceEntity: EntityType;
  targetEntity: EntityType;

  sourceAccountId: string;
  targetAccountId: string;

  amount: number;
  currency: CurrencyType;

  date: Date;
  description?: string;
}