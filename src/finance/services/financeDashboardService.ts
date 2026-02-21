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

const TX_COLLECTION = "finance_transactions";
const ACCOUNT_COLLECTION = "finance_accounts";
const FORECAST_COLLECTION = "finance_forecasts";

/* ============================= */
/*        HELPER FUNCTIONS       */
/* ============================= */

function isWithinPeriod(
  date: Date,
  start: Date,
  end: Date
) {
  return date >= start && date <= end;
}

/* ============================= */
/*      ENTITY DASHBOARD         */
/* ============================= */

export async function getEntityDashboard(
  entity: EntityType,
  filter: PeriodFilter
): Promise<EntityDashboardSummary> {
  const txQuery = query(
    collection(db, TX_COLLECTION),
    where("entity", "==", entity)
  );

  const snapshot = await getDocs(txQuery);

  let totalIncome = 0;
  let totalExpense = 0;

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const txDate = (data.date as Timestamp).toDate();

    if (!isWithinPeriod(txDate, filter.startDate, filter.endDate)) return;

    if (data.type === "income") totalIncome += data.amount;
    if (data.type === "expense") totalExpense += data.amount;
  });

  const netResult = totalIncome - totalExpense;

  /* ===== Accounts ===== */

  const accQuery = query(
    collection(db, ACCOUNT_COLLECTION),
    where("entity", "==", entity)
  );

  const accSnapshot = await getDocs(accQuery);

  let totalCash = 0;
  let totalBank = 0;
  let totalMobile = 0;

  accSnapshot.forEach((docSnap) => {
    const acc = docSnap.data();
    const balance = acc.initialBalance || 0;

    if (acc.type === "cash") totalCash += balance;
    if (acc.type === "bank") totalBank += balance;
    if (acc.type === "mobile") totalMobile += balance;
  });

  const totalTreasury =
    totalCash + totalBank + totalMobile + netResult;

  /* ===== Forecast ===== */

  const forecastQuery = query(
    collection(db, FORECAST_COLLECTION),
    where("entity", "==", entity)
  );

  const forecastSnapshot = await getDocs(forecastQuery);

  let forecastIncome = 0;
  let forecastExpense = 0;

  forecastSnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const plannedDate = (data.plannedDate as Timestamp).toDate();

    if (!isWithinPeriod(plannedDate, filter.startDate, filter.endDate))
      return;

    if (data.type === "income") forecastIncome += data.amount;
    if (data.type === "expense") forecastExpense += data.amount;
  });

  const forecastGap =
    (forecastIncome - forecastExpense) - netResult;

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
    const data = docSnap.data();
    const txDate = (data.date as Timestamp).toDate();

    if (!isWithinPeriod(txDate, filter.startDate, filter.endDate)) return;

    // Exclure transferts internes
    if (data.isInternalTransfer) return;

    if (data.type === "income") totalIncome += data.amount;
    if (data.type === "expense") totalExpense += data.amount;
  });

  const netResult = totalIncome - totalExpense;

  /* ===== Accounts ===== */

  const accSnapshot = await getDocs(
    collection(db, ACCOUNT_COLLECTION)
  );

  let totalCash = 0;
  let totalBank = 0;
  let totalMobile = 0;

  accSnapshot.forEach((docSnap) => {
    const acc = docSnap.data();
    const balance = acc.initialBalance || 0;

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