import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  collection,
  onSnapshot,
  Timestamp,
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { EntityType, EntityDashboardSummary } from "@/types/finance.types";

type UseFinanceDashboardOptions = {
  month: number; // 0 = janvier
  year: number;
};

export function useFinanceDashboard(
  entity: EntityType,
  options: UseFinanceDashboardOptions
) {
  const [data, setData] = useState<EntityDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const { month, year } = options;

  useFocusEffect(
    useCallback(() => {
      setLoading(true);

      const unsubscribe = onSnapshot(
        collection(db, "finance", entity, "transactions"),
        async (snapshot) => {
          try {
            let totalIncome = 0;
            let totalExpense = 0;

            let totalCash = 0;
            let totalBank = 0;
            let totalMobile = 0;

            let totalTreasury = 0;

            snapshot.forEach((docSnap) => {
              const tx = docSnap.data();

              if (!tx?.date) return;

              const isArchived =
                tx.archived === true ||
                tx.archived === "true" ||
                tx.status === "archived";

              if (isArchived) return;

              const amount = Number(tx.amount || 0);

              const txDate =
                tx.date instanceof Timestamp
                  ? tx.date.toDate()
                  : new Date(tx.date);

              if (Number.isNaN(txDate.getTime())) return;

              /* TREASURY GLOBAL */

              if (tx.type === "income") totalTreasury += amount;
              if (tx.type === "expense") totalTreasury -= amount;

              /* FILTRE MOIS */

              const txMonth = txDate.getMonth();
              const txYear = txDate.getFullYear();

              if (txMonth !== month || txYear !== year) return;

              /* RESULTAT MENSUEL */

              if (tx.type === "income") totalIncome += amount;
              if (tx.type === "expense") totalExpense += amount;

              /* PAYMENT METHODS */

              if (tx.paymentMethod === "cash") {
                tx.type === "income"
                  ? (totalCash += amount)
                  : (totalCash -= amount);
              }

              if (tx.paymentMethod === "bank") {
                tx.type === "income"
                  ? (totalBank += amount)
                  : (totalBank -= amount);
              }

              if (tx.paymentMethod === "mobile") {
                tx.type === "income"
                  ? (totalMobile += amount)
                  : (totalMobile -= amount);
              }
            });

            const netResult = totalIncome - totalExpense;

            /* ============================= */
            /*        LOAD BUDGET            */
            /* ============================= */

            const budgetId = `${year}-${String(month + 1).padStart(2, "0")}`;

            const budgetRef = doc(
              db,
              "finance",
              entity,
              "budgets",
              budgetId
            );

            const budgetSnap = await getDoc(budgetRef);

            let totalBudget = 0;
            let budgetByCategory: any = {};

            if (budgetSnap.exists()) {
              const budgetData = budgetSnap.data();

              totalBudget = Number(budgetData.total || 0);

              budgetByCategory = budgetData.categories || {};
            }

            /* ============================= */
            /*           SET DATA            */
            /* ============================= */

            setData({
              totalIncome,
              totalExpense,
              netResult,

              totalCash,
              totalBank,
              totalMobile,
              totalTreasury,

              forecastIncome: 0,
              forecastExpense: 0,
              executedForecastIncome: 0,
              executedForecastExpense: 0,
              plannedNet: 0,
              forecastGap: 0,
              executionRate: 0,

              totalBudget,
              budgetGap: totalBudget - totalExpense,
              budgetByCategory,
            });

            setLoading(false);
          } catch (error) {
            console.error("Dashboard error:", error);
            setLoading(false);
          }
        }
      );

      return () => unsubscribe();
    }, [entity, month, year])
  );

  return { data, loading };
}