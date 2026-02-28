import { useEffect, useState, useCallback } from "react";
import { getAccountsByEntity } from "@/src/finance/services/financeAccountService";
import { Account, EntityType } from "@/types/finance.types";

/* ============================= */
/* SYSTEM DEFAULT ACCOUNTS      */
/* ============================= */

function getSystemAccounts(entity: EntityType): Account[] {
  return [
    {
      id: `${entity}-cash`,
      name: "💵 Espèces",
      entity,
      type: "cash",
      currency: "USD",
      initialBalance: 0,
      currentBalance: 0,
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: `${entity}-bank`,
      name: "🏦 Banque",
      entity,
      type: "bank",
      currency: "USD",
      initialBalance: 0,
      currentBalance: 0,
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: `${entity}-mobile`,
      name: "📱 Mobile",
      entity,
      type: "mobile",
      currency: "USD",
      initialBalance: 0,
      currentBalance: 0,
      isActive: true,
      createdAt: new Date(),
    },
  ];
}

/* ============================= */

export function useAccounts(entity: EntityType) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const firestoreAccounts = await getAccountsByEntity(entity);
      const systemAccounts = getSystemAccounts(entity);

      if (!firestoreAccounts || firestoreAccounts.length === 0) {
        setAccounts(systemAccounts);
      } else {
        // Fusion système + Firestore
        const merged = [...systemAccounts, ...firestoreAccounts];

        // Supprimer doublons par id
        const unique = merged.filter(
          (acc, index, self) =>
            index === self.findIndex((a) => a.id === acc.id)
        );

        setAccounts(unique);
      }
    } catch (err: any) {
      console.error("Erreur chargement comptes :", err);
      setError("Impossible de charger les comptes");

      // Fallback système
      setAccounts(getSystemAccounts(entity));
    } finally {
      setLoading(false);
    }
  }, [entity]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  return {
    accounts,
    loading,
    error,
    reload: loadAccounts,
  };
}