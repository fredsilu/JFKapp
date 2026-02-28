import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  collection,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { EntityType, EntityDashboardSummary } from "@/types/finance.types";

function isWithinPeriod(date: Date, start: Date, end: Date) {
  return date >= start && date <= end;
}

export function useFinanceDashboard(entity: EntityType) {
  const [data, setData] =
    useState<EntityDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);

      const startDate = new Date();
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date();

      const unsubscribe = onSnapshot(
        collection(db, "finance", entity, "transactions"),
        (snapshot) => {
          let totalIncome = 0;
          let totalExpense = 0;

          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (!data.date) return;

            const txDate =
              data.date instanceof Timestamp
                ? data.date.toDate()
                : new Date(data.date);

            if (!isWithinPeriod(txDate, startDate, endDate))
              return;

            if (data.type === "income") {
              totalIncome += Number(data.amount || 0);
            }

            if (data.type === "expense") {
              totalExpense += Number(data.amount || 0);
            }
          });

          const netResult = totalIncome - totalExpense;

          setData({
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
            totalBudget: 0,
            budgetGap: 0,
            budgetByCategory: {},
          });

          setLoading(false);
        }
      );

      return () => unsubscribe();
    }, [entity])
  );

  return { data, loading };
}