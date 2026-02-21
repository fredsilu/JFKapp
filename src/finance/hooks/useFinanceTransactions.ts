import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getTransactionsByEntity } from "@/src/finance/services/financeTransactionService";
import { Transaction } from "@/types/finance.types";

export function useFinanceTransactions(entity: "maison" | "crepolia") {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await getTransactionsByEntity(entity);
    setTransactions(data);
    setLoading(false);
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [entity])
  );

  return { transactions, loading, reload: load };
}