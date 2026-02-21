import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { EntityType } from "./accountService";

export const getEntitySummary = async (entity: EntityType) => {
  const accountsRef = collection(db, "finance", entity, "accounts");
  const transactionsRef = collection(db, "finance", entity, "transactions");

  const [accountsSnap, transactionsSnap] = await Promise.all([
    getDocs(accountsRef),
    getDocs(transactionsRef),
  ]);

  let balances: Record<string, number> = {};
  let totalUSD = 0;
  let totalCDF = 0;

  accountsSnap.forEach((doc) => {
    const acc = doc.data();
    balances[doc.id] = acc.initialBalance;
  });

  transactionsSnap.forEach((doc) => {
    const tx = doc.data();

    if (!balances.hasOwnProperty(tx.accountId)) return;

    if (tx.type === "income") {
      balances[tx.accountId] += tx.amount;
    }

    if (tx.type === "expense") {
      balances[tx.accountId] -= tx.amount;
    }
  });

  accountsSnap.forEach((doc) => {
    const acc = doc.data();
    const balance = balances[doc.id];

    if (acc.currency === "USD") totalUSD += balance;
    if (acc.currency === "CDF") totalCDF += balance;
  });

  return {
    balances,
    totalUSD,
    totalCDF,
  };
};