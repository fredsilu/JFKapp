import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { EntityType } from "./accountService";
import {
  Transaction,
  Budget,
} from "@/types/finance.types";
import { buildBudgetByCategory } from "@/src/finance/utils/budget.utils";

export const getEntitySummary = async (entity: EntityType) => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const accountsRef = collection(db, "finance", entity, "accounts");
  const transactionsRef = collection(db, "finance", entity, "transactions");

  const budgetsRef = query(
    collection(db, "budgets"),
    where("entity", "==", entity),
    where("month", "==", month),
    where("year", "==", year)
  );

  const [accountsSnap, transactionsSnap, budgetsSnap] =
    await Promise.all([
      getDocs(accountsRef),
      getDocs(transactionsRef),
      getDocs(budgetsRef),
    ]);

  /* ============================= */
  /*       MAP TRANSACTIONS       */
  /* ============================= */

  const transactions: Transaction[] = transactionsSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date?.toDate(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as Transaction[];

  /* ============================= */
  /*         MAP BUDGETS          */
  /* ============================= */

  const budgets: Budget[] = budgetsSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as Budget[];

  /* ============================= */
  /*      BUILD BUDGET LOGIC      */
  /* ============================= */

  const budgetByCategory = buildBudgetByCategory(
    budgets,
    transactions
  );

  const totalBudget = budgets.reduce(
    (sum, b) => sum + b.amount,
    0
  );

  const budgetGap = Object.values(budgetByCategory).reduce(
    (sum, c) => sum + c.gap,
    0
  );

  /* ============================= */
  /*      ACCOUNT BALANCES        */
  /* ============================= */

  let balances: Record<string, number> = {};
  let totalUSD = 0;
  let totalCDF = 0;

  accountsSnap.forEach((doc) => {
    const acc = doc.data();
    balances[doc.id] = acc.initialBalance;
  });

  transactions.forEach((tx) => {
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

  /* ============================= */
  /*           RETURN             */
  /* ============================= */

  return {
    balances,
    totalUSD,
    totalCDF,
    budgetByCategory,
    totalBudget,
    budgetGap,
  };
};