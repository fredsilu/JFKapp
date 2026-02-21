import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { EntityType } from "@/types/finance.types";

const FORECAST_COLLECTION = "finance_forecasts";
const ACCOUNT_COLLECTION = "finance_accounts";

export async function getProjection90Days(entity: EntityType) {
  const now = new Date();
  const endDate = new Date();
  endDate.setDate(now.getDate() + 90);

  /* ===== Current Treasury ===== */

  const accSnapshot = await getDocs(
    query(collection(db, ACCOUNT_COLLECTION), where("entity", "==", entity))
  );

  let currentTreasury = 0;

  accSnapshot.forEach((docSnap) => {
    const acc = docSnap.data();
    currentTreasury += acc.initialBalance || 0;
  });

  /* ===== Forecast ===== */

  const forecastSnapshot = await getDocs(
    query(collection(db, FORECAST_COLLECTION), where("entity", "==", entity))
  );

  let projectedIncome = 0;
  let projectedExpense = 0;

  forecastSnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const plannedDate = (data.plannedDate as Timestamp).toDate();

    if (plannedDate < now || plannedDate > endDate) return;

    if (data.type === "income") projectedIncome += data.amount;
    if (data.type === "expense") projectedExpense += data.amount;
  });

  const projectedTreasury =
    currentTreasury + projectedIncome - projectedExpense;

  return {
    currentTreasury,
    projectedIncome,
    projectedExpense,
    projectedTreasury,
  };
}