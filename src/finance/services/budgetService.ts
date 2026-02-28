import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
  updateDoc,
  doc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import {
  Budget,
  EntityType,
  CurrencyType,
} from "@/types/finance.types"

/* ============================= */
/*         COLLECTION            */
/* ============================= */

const budgetCollection = collection(db, "budgets")

/* ============================= */
/*     CREATE OR UPDATE BUDGET  */
/* ============================= */

export async function createOrUpdateBudget(
  entity: EntityType,
  category: string,
  month: number,
  year: number,
  amount: number,
  currency: CurrencyType
): Promise<void> {
  const q = query(
    budgetCollection,
    where("entity", "==", entity),
    where("category", "==", category),
    where("month", "==", month),
    where("year", "==", year)
  )

  const snapshot = await getDocs(q)

  if (!snapshot.empty) {
    // 🔄 Update existing budget
    const existingDoc = snapshot.docs[0]

    await updateDoc(doc(db, "budgets", existingDoc.id), {
      amount,
      currency,
      updatedAt: Timestamp.now(),
    })
  } else {
    // ➕ Create new budget
    await addDoc(budgetCollection, {
      entity,
      category,
      month,
      year,
      amount,
      currency,
      createdAt: Timestamp.now(),
    })
  }
}

/* ============================= */
/*     GET BUDGETS BY PERIOD    */
/* ============================= */

export async function getBudgetsByPeriod(
  entity: EntityType,
  month: number,
  year: number
): Promise<Budget[]> {
  const q = query(
    budgetCollection,
    where("entity", "==", entity),
    where("month", "==", month),
    where("year", "==", year)
  )

  const snapshot = await getDocs(q)

  return snapshot.docs.map((d) => {
    const data = d.data()

    return {
      id: d.id,
      entity: data.entity,
      category: data.category,
      month: data.month,
      year: data.year,
      amount: data.amount,
      currency: data.currency,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as Budget
  })
}

/* ============================= */
/*        DELETE BUDGET         */
/* ============================= */

export async function deleteBudget(budgetId: string): Promise<void> {
  await updateDoc(doc(db, "budgets", budgetId), {
    deleted: true,
    updatedAt: Timestamp.now(),
  })
}