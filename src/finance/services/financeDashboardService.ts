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

/* ===================================================== */
/*                    HELPERS                            */
/* ===================================================== */

function isWithinPeriod(date: Date, start: Date, end: Date) {
  return date >= start && date <= end;
}

function parseDate(value: any): Date | null {
  if (!value) return null;

  if (value instanceof Timestamp) {
    return value.toDate();
  }

  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/* ===================================================== */
/*              ENTITY DASHBOARD                         */
/* ===================================================== */

export async function getEntityDashboard(
  entity: EntityType,
  filter: PeriodFilter
): Promise<EntityDashboardSummary> {
  // ✅ IMPORTANT : nouvelle structure Firestore
  const txQuery = query(
    collection(db, "finance", entity, "transactions")
  );

  const txSnapshot = await getDocs(txQuery);

  let totalIncome = 0;
  let totalExpense = 0;

  const expenseByCategory: Record<string, number> = {};

  txSnapshot.forEach((docSnap) => {
    const data = docSnap.data() as DocumentData;
    const txDate = parseDate(data.date);

    if (!txDate) return;

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
      collection(db, "finance_budgets"),
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

  /* ================= RETURN ================= */

  return {
    totalIncome,
    totalExpense,
    netResult,

    // 🔥 Pour l’instant trésorerie = résultat net
    totalCash: 0,
    totalBank: 0,
    totalMobile: 0,
    totalTreasury: netResult,

    // Forecast (non implémenté encore)
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

/* ===================================================== */
/*                GROUP DASHBOARD                        */
/* ===================================================== */

export async function getGroupDashboard(
  filter: PeriodFilter
): Promise<GroupDashboardSummary> {

  const entities: EntityType[] = ["maison", "crepolia"];

  let totalIncome = 0;
  let totalExpense = 0;

  for (const entity of entities) {
    const txQuery = query(
      collection(db, "finance", entity, "transactions")
    );

    const snapshot = await getDocs(txQuery);

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as DocumentData;
      const txDate = parseDate(data.date);

      if (!txDate) return;

      if (!isWithinPeriod(txDate, filter.startDate, filter.endDate)) return;

      // 🔥 On exclut les transferts internes
      if (data.isInternalTransfer) return;

      if (data.type === "income") {
        totalIncome += Number(data.amount || 0);
      }

      if (data.type === "expense") {
        totalExpense += Number(data.amount || 0);
      }
    });
  }

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