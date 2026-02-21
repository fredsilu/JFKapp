import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

import {
  EntityType,
  EntityDashboardSummary,
  GroupDashboardSummary,
  PeriodFilter,
} from "@/types/finance.types";

const TX_COLLECTION = "finance_transactions";
const ACCOUNT_COLLECTION = "finance_accounts";
const FORECAST_COLLECTION = "finance_forecasts";
const BUDGET_COLLECTION = "finance_budgets";

function isWithinPeriod(date: Date, start: Date, end: Date) {
  return date >= start && date <= end;
}

export async function getEntityDashboard(
  entity: EntityType,
  filter: PeriodFilter
): Promise<EntityDashboardSummary> {

  const txQuery = query(
    collection(db, TX_COLLECTION),
    where("entity", "==", entity)
  );

  const txSnapshot = await getDocs(txQuery);

  let totalIncome = 0;
  let totalExpense = 0;

  const expenseByCategory: Record<string, number> = {};

  txSnapshot.forEach((docSnap) => {
    const data = docSnap.data() as DocumentData;
    if (!data.date) return;

    const txDate =
      data.date instanceof Timestamp
        ? data.date.toDate()
        : new Date(data.date);

    if (!isWithinPeriod(txDate, filter.startDate, filter.endDate)) return;

    if (data.type === "income") {
      totalIncome += Number(data.amount || 0);
    }

    if (data.type === "expense") {
      const amount = Number(data.amount || 0);
      totalExpense += amount;

      if (!expenseByCategory[data.category]) {
        expenseByCategory[data.category] = 0;
      }

      expenseByCategory[data.category] += amount;
    }
  });

  const netResult = totalIncome - totalExpense;

  /* ================= BUDGET ================= */

  const currentMonth = filter.startDate.getMonth();
  const currentYear = filter.startDate.getFullYear();

  const budgetSnapshot = await getDocs(
    query(
      collection(db, BUDGET_COLLECTION),
      where("entity", "==", entity),
      where("month", "==", currentMonth),
      where("year", "==", currentYear)
    )
  );

  let totalBudget = 0;

  const budgetByCategory: Record<
    string,
    {
      budget: number;
      actual: number;
      gap: number;
      usageRate: number;
    }
  > = {};

  budgetSnapshot.forEach((docSnap) => {
    const data = docSnap.data() as DocumentData;
    const category = data.category;
    const budgetAmount = Number(data.amount || 0);

    totalBudget += budgetAmount;

    const actual = expenseByCategory[category] || 0;
    const gap = budgetAmount - actual;
    const usageRate =
      budgetAmount > 0 ? (actual / budgetAmount) * 100 : 0;

    budgetByCategory[category] = {
      budget: budgetAmount,
      actual,
      gap,
      usageRate,
    };
  });

  const budgetGap = totalBudget - totalExpense;

  return {
    totalIncome,
    totalExpense,
    netResult,

    totalCash: 0,
    totalBank: 0,
    totalMobile: 0,
    totalTreasury: netResult,

    forecastIncome: 0,
    forecastExpense: 0,
    executedForecastIncome: 0,
    executedForecastExpense: 0,
    plannedNet: 0,
    forecastGap: 0,
    executionRate: 0,

    totalBudget,
    budgetGap,
    budgetByCategory,
  };
}

/* ================= GROUP ================= */

export async function getGroupDashboard(
  filter: PeriodFilter
): Promise<GroupDashboardSummary> {

  const snapshot = await getDocs(
    collection(db, TX_COLLECTION)
  );

  let totalIncome = 0;
  let totalExpense = 0;

  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as DocumentData;
    if (!data.date) return;

    const txDate =
      data.date instanceof Timestamp
        ? data.date.toDate()
        : new Date(data.date);

    if (!isWithinPeriod(txDate, filter.startDate, filter.endDate)) return;

    if (data.isInternalTransfer) return;

    if (data.type === "income") totalIncome += Number(data.amount || 0);
    if (data.type === "expense") totalExpense += Number(data.amount || 0);
  });

  const netResult = totalIncome - totalExpense;

  return {
    totalIncome,
    totalExpense,
    netResult,
    totalTreasury: netResult,
    totalCash: 0,
    totalBank: 0,
    totalMobile: 0,
    forecastGap: 0,
  };
}