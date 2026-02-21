import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

type EntityType = "maison" | "crepolia";

const ENTITIES: EntityType[] = ["maison", "crepolia"];

export const getGroupDashboard = async () => {
  let totalIncome = 0;
  let totalExpense = 0;
  let totalTreasury = 0;

  for (const entity of ENTITIES) {
    const accountsSnap = await getDocs(
      collection(db, "finance", entity, "accounts")
    );

    const transactionsSnap = await getDocs(
      collection(db, "finance", entity, "transactions")
    );

    let balances: Record<string, number> = {};

    // Init soldes
    accountsSnap.forEach((doc) => {
      const acc = doc.data();
      balances[doc.id] = acc.initialBalance || 0;
    });

    transactionsSnap.forEach((doc) => {
      const tx = doc.data();

      // 🔥 NEUTRALISATION TRANSFERTS INTERNES
      if (tx.isInternalTransfer) return;

      if (!balances.hasOwnProperty(tx.accountId)) return;

      if (tx.type === "income") {
        totalIncome += tx.amount;
        balances[tx.accountId] += tx.amount;
      }

      if (tx.type === "expense") {
        totalExpense += tx.amount;
        balances[tx.accountId] -= tx.amount;
      }
    });

    Object.values(balances).forEach((balance) => {
      totalTreasury += balance;
    });
  }

  return {
    totalIncome,
    totalExpense,
    netResult: totalIncome - totalExpense,
    totalTreasury,
  };
};