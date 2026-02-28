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

   isActive: boolean; // ← ici

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

  forecastId?: string;

  isInternalTransfer?: boolean;
  transferId?: string;
  internalTargetEntity?: EntityType;

  createdAt: Date;
  updatedAt?: Date;
}

/* ============================= */
/*         FORECAST              */
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

  isExecuted: boolean;
  linkedTransactionId?: string;

  createdAt: Date;
  updatedAt?: Date;
}

/* ============================= */
/*         BUDGET                */
/* ============================= */

export interface Budget {
  id: string;

  entity: EntityType;

  category: string;

  month: number; // 0-11
  year: number;

  amount: number;
  currency: CurrencyType;

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

  executedForecastIncome: number;
  executedForecastExpense: number;

  plannedNet: number;
  forecastGap: number;

  executionRate: number;

  /* 🔥 Budget fields ajoutés */
  totalBudget?: number;
  budgetGap?: number;

  dividend?: number;
  dividendRate?: number;
  budgetByCategory?: Record<
    string,
    {
      budget: number;
      actual: number;
      gap: number;
      usageRate: number;
    }
  >;
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