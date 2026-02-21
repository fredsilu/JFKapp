import { useEffect, useState, useCallback } from "react";
import { getAccountsByEntity } from "@/src/finance/services/financeAccountService";
import { Account } from "@/types/finance.types";

export function useAccounts(entity: "maison" | "crepolia") {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getAccountsByEntity(entity);
      setAccounts(data);
    } catch (err: any) {
      console.error("Erreur chargement comptes :", err);
      setError("Impossible de charger les comptes");
    } finally {
      setLoading(false);
    }
  }, [entity]);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (!isMounted) return;
      await loadAccounts();
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [loadAccounts]);

  return {
    accounts,
    loading,
    error,
    reload: loadAccounts,
  };
}