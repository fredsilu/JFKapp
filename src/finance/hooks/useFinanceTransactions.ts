import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getTransactionsByEntity } from "@/src/finance/services/financeTransactionService";
import { Transaction } from "@/types/finance.types";

export function useFinanceTransactions(entity: "maison" | "crepolia") {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTransactionsByEntity(entity);
      setTransactions(data);
    } catch (error) {
      console.log("Erreur chargement transactions:", error);
    } finally {
      setLoading(false);
    }
  }, [entity]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return {
    transactions,
    loading,
    reload: load,
  };
}