import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  getArchivedTransactions,
  Entity,
} from "@/src/finance/services/financeTransactionService";
import { Transaction } from "@/types/finance.types";

export function useArchivedTransactions(entity: Entity) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getArchivedTransactions(entity);
      setTransactions(data);
    } catch (error) {
      console.log("Erreur chargement archives:", error);
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