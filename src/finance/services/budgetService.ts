import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase";
import { Budget } from "@/types/budget.types"

const budgetCollection = collection(db, "budgets")

export async function createBudget(budget: Omit<Budget, "id" | "createdAt">) {
  await addDoc(budgetCollection, {
    ...budget,
    createdAt: Timestamp.now(),
  })
}

export async function getBudgetsByEntityAndMonth(
  entity: "maison" | "crepolia",
  month: string
): Promise<Budget[]> {
  const q = query(
    budgetCollection,
    where("entity", "==", entity),
    where("month", "==", month)
  )

  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Budget[]
}