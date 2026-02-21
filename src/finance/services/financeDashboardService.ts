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

/* ============================= */
/*        COLLECTIONS            */
/* ============================= */

const TX_COLLECTION = "finance_transactions";
const ACCOUNT_COLLECTION = "finance_accounts";
const FORECAST_COLLECTION = "finance_forecasts";

/* ============================= */
/*        HELPER FUNCTION        */
/* ============================= */

function isWithinPeriod(date: Date, start: Date, end: Date) {
  return date >= start && date <= end;
}

/* ============================= */
/*      ENTITY DASHBOARD         */
/* ============================= */

export async function getEntityDashboard(
  entity: EntityType,
  filter: PeriodFilter
): Promise<EntityDashboardSummary> {

  /* ================= TRANSACTIONS ================= */

  const txQuery = query(
    collection(db, TX_COLLECTION),
    where("entity", "==", entity)
  );

  const txSnapshot = await getDocs(txQuery);

  let totalIncome = 0;
  let totalExpense = 0;

  txSnapshot.forEach((docSnap) => {
    const data = docSnap.data() as DocumentData;
    if (!data.date) return;

    const txDate =
      data.date instanceof Timestamp
        ? data.date.toDate()
        : new Date(data.date);

    if (!isWithinPeriod(txDate, filter.startDate, filter.endDate)) return;

    if (data.type === "income") totalIncome += Number(data.amount || 0);
    if (data.type === "expense") totalExpense += Number(data.amount || 0);
  });

  const netResult = totalIncome - totalExpense;

  /* ================= ACCOUNTS ================= */

  const accQuery = query(
    collection(db, ACCOUNT_COLLECTION),
    where("entity", "==", entity)
  );

  const accSnapshot = await getDocs(accQuery);

  let totalCash = 0;
  let totalBank = 0;
  let totalMobile = 0;

  accSnapshot.forEach((docSnap) => {
    const acc = docSnap.data() as DocumentData;
    const balance = Number(acc.initialBalance || 0);

    if (acc.type === "cash") totalCash += balance;
    if (acc.type === "bank") totalBank += balance;
    if (acc.type === "mobile") totalMobile += balance;
  });

  const totalTreasury =
    totalCash + totalBank + totalMobile + netResult;

  /* ================= FORECAST ================= */

  const forecastQuery = query(
    collection(db, FORECAST_COLLECTION),
    where("entity", "==", entity)
  );

  const forecastSnapshot = await getDocs(forecastQuery);

  let forecastIncome = 0;
  let forecastExpense = 0;
  let executedForecastIncome = 0;
  let executedForecastExpense = 0;

  forecastSnapshot.forEach((docSnap) => {
    const data = docSnap.data() as DocumentData;
    if (!data.plannedDate) return;

    const plannedDate =
      data.plannedDate instanceof Timestamp
        ? data.plannedDate.toDate()
        : new Date(data.plannedDate);

    if (!isWithinPeriod(plannedDate, filter.startDate, filter.endDate)) return;

    if (data.isExecuted) {
      if (data.type === "income")
        executedForecastIncome += Number(data.amount || 0);
      if (data.type === "expense")
        executedForecastExpense += Number(data.amount || 0);
    } else {
      if (data.type === "income")
        forecastIncome += Number(data.amount || 0);
      if (data.type === "expense")
        forecastExpense += Number(data.amount || 0);
    }
  });

  const plannedNet = forecastIncome - forecastExpense;
  const forecastGap = netResult - plannedNet;

  const totalForecast =
    forecastIncome +
    forecastExpense +
    executedForecastIncome +
    executedForecastExpense;

  const totalExecuted =
    executedForecastIncome + executedForecastExpense;

  const executionRate =
    totalForecast > 0 ? (totalExecuted / totalForecast) * 100 : 0;

  return {
    totalIncome,
    totalExpense,
    netResult,
    totalCash,
    totalBank,
    totalMobile,
    totalTreasury,
    forecastIncome,
    forecastExpense,
    executedForecastIncome,
    executedForecastExpense,
    plannedNet,
    forecastGap,
    executionRate,
  };
}

/* ============================= */
/*       GROUP DASHBOARD         */
/* ============================= */

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

  const accSnapshot = await getDocs(
    collection(db, ACCOUNT_COLLECTION)
  );

  let totalCash = 0;
  let totalBank = 0;
  let totalMobile = 0;

  accSnapshot.forEach((docSnap) => {
    const acc = docSnap.data() as DocumentData;
    const balance = Number(acc.initialBalance || 0);

    if (acc.type === "cash") totalCash += balance;
    if (acc.type === "bank") totalBank += balance;
    if (acc.type === "mobile") totalMobile += balance;
  });

  const totalTreasury =
    totalCash + totalBank + totalMobile + netResult;

  return {
    totalIncome,
    totalExpense,
    netResult,
    totalTreasury,
    totalCash,
    totalBank,
    totalMobile,
    forecastGap: 0,
  };
}