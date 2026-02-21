import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
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
/*         HELPER                */
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

  /* ===== LOAD DATA ===== */

  const txSnapshot = await getDocs(
    query(collection(db, TX_COLLECTION), where("entity", "==", entity))
  );

  const accSnapshot = await getDocs(
    query(collection(db, ACCOUNT_COLLECTION), where("entity", "==", entity))
  );

  const forecastSnapshot = await getDocs(
    query(collection(db, FORECAST_COLLECTION), where("entity", "==", entity))
  );

  /* ===== INIT BALANCES ===== */

  const balances: Record<string, number> = {};

  accSnapshot.forEach((docSnap) => {
    const acc = docSnap.data();
    balances[docSnap.id] = acc.initialBalance || 0;
  });

  let totalIncome = 0;
  let totalExpense = 0;

  /* ===== APPLY TRANSACTIONS ===== */

  txSnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const txDate = (data.date as Timestamp).toDate();

    if (!isWithinPeriod(txDate, filter.startDate, filter.endDate)) return;

    if (!balances.hasOwnProperty(data.accountId)) return;

    if (data.type === "income") {
      totalIncome += data.amount;
      balances[data.accountId] += data.amount;
    }

    if (data.type === "expense") {
      totalExpense += data.amount;
      balances[data.accountId] -= data.amount;
    }
  });

  const netResult = totalIncome - totalExpense;

  /* ===== TREASURY BY TYPE ===== */

  let totalCash = 0;
  let totalBank = 0;
  let totalMobile = 0;

  accSnapshot.forEach((docSnap) => {
    const acc = docSnap.data();
    const balance = balances[docSnap.id] || 0;

    if (acc.type === "cash") totalCash += balance;
    if (acc.type === "bank") totalBank += balance;
    if (acc.type === "mobile") totalMobile += balance;
  });

  const totalTreasury = totalCash + totalBank + totalMobile;

  /* ===== FORECAST ===== */

  let forecastIncome = 0;
  let forecastExpense = 0;

  forecastSnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const plannedDate = (data.plannedDate as Timestamp).toDate();

    if (!isWithinPeriod(plannedDate, filter.startDate, filter.endDate)) return;

    if (data.type === "income") forecastIncome += data.amount;
    if (data.type === "expense") forecastExpense += data.amount;
  });

  const forecastGap =
    (forecastIncome - forecastExpense) - netResult;

  let dividend = 0;
  let dividendRate = 0;

  if (entity === "crepolia") {
    dividendRate = 0.4;
    dividend = netResult > 0 ? netResult * dividendRate : 0;
  }

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
  forecastGap,
  dividend,
  dividendRate,
};
}

/* ============================= */
/*       GROUP DASHBOARD         */
/* ============================= */

export async function getGroupDashboard(
  filter: PeriodFilter
): Promise<GroupDashboardSummary> {

  const txSnapshot = await getDocs(
    collection(db, TX_COLLECTION)
  );

  const accSnapshot = await getDocs(
    collection(db, ACCOUNT_COLLECTION)
  );

  /* ===== INIT BALANCES ===== */

  const balances: Record<string, number> = {};

  accSnapshot.forEach((docSnap) => {
    const acc = docSnap.data();
    balances[docSnap.id] = acc.initialBalance || 0;
  });

  let totalIncome = 0;
  let totalExpense = 0;

  /* ===== APPLY TRANSACTIONS ===== */

  txSnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const txDate = (data.date as Timestamp).toDate();

    if (!isWithinPeriod(txDate, filter.startDate, filter.endDate)) return;

    // 🔥 Neutralisation transferts internes
    if (data.isInternalTransfer) return;

    if (!balances.hasOwnProperty(data.accountId)) return;

    if (data.type === "income") {
      totalIncome += data.amount;
      balances[data.accountId] += data.amount;
    }

    if (data.type === "expense") {
      totalExpense += data.amount;
      balances[data.accountId] -= data.amount;
    }
  });

  /* ===== TREASURY BY TYPE ===== */

  let totalCash = 0;
  let totalBank = 0;
  let totalMobile = 0;

  accSnapshot.forEach((docSnap) => {
    const acc = docSnap.data();
    const balance = balances[docSnap.id] || 0;

    if (acc.type === "cash") totalCash += balance;
    if (acc.type === "bank") totalBank += balance;
    if (acc.type === "mobile") totalMobile += balance;
  });

  const totalTreasury = totalCash + totalBank + totalMobile;

  return {
    totalIncome,
    totalExpense,
    netResult: totalIncome - totalExpense,
    totalTreasury,
    totalCash,
    totalBank,
    totalMobile,
    forecastGap: 0,
  };
}