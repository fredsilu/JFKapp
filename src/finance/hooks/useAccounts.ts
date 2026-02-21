import { useEffect, useState } from "react";
import { getAccountsByEntity } from "@/src/finance/services/financeAccountService";
import { Account } from "@/types/finance.types";

export function useAccounts(entity: "maison" | "crepolia") {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getAccountsByEntity(entity);
      setAccounts(data);
      setLoading(false);
    }

    load();
  }, [entity]);

  return { accounts, loading };
}