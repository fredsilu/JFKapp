import {
  collection,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";


const FORECAST_COLLECTION = "finance_forecasts";
const ACCOUNT_COLLECTION = "finance_accounts";


export async function getGroupProjection90Days() {
  const now = new Date();
  const endDate = new Date();
  endDate.setDate(now.getDate() + 90);

  let currentTreasury = 0;
  let projectedIncome = 0;
  let projectedExpense = 0;

  /* ===== Current Treasury (real balances) ===== */

  const accSnapshot = await getDocs(
    collection(db, ACCOUNT_COLLECTION)
  );

  accSnapshot.forEach((docSnap) => {
    const acc = docSnap.data();
    currentTreasury += acc.initialBalance || 0;
  });

  /* ===== Forecast ===== */

  const forecastSnapshot = await getDocs(
    collection(db, FORECAST_COLLECTION)
  );

  forecastSnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const plannedDate = (data.plannedDate as Timestamp).toDate();

    if (plannedDate < now || plannedDate > endDate) return;

    // ⚠️ On NE neutralise PAS ici car forecast n'est pas interne
    if (data.type === "income") projectedIncome += data.amount;
    if (data.type === "expense") projectedExpense += data.amount;
  });

  /* ===== Remove internal forecast if needed (future enhancement) ===== */

  const projectedTreasury =
    currentTreasury + projectedIncome - projectedExpense;

  return {
    currentTreasury,
    projectedIncome,
    projectedExpense,
    projectedTreasury,
    risk:
      projectedTreasury < 0
        ? "HIGH"
        : projectedTreasury < currentTreasury * 0.2
        ? "MEDIUM"
        : "LOW",
  };
}