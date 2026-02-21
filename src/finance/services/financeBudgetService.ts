import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { EntityType, Budget } from "@/types/finance.types";

const COLLECTION = "finance_budgets";

/* ============================= */
/*        CREATE BUDGET          */
/* ============================= */

export async function createBudget(
  budget: Omit<Budget, "id" | "createdAt">
) {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...budget,
    createdAt: Timestamp.now(),
  });

  return ref.id;
}

/* ============================= */
/*        GET BY MONTH           */
/* ============================= */

export async function getBudgetsByMonth(
  entity: EntityType,
  month: number,
  year: number
): Promise<Budget[]> {

  const q = query(
    collection(db, COLLECTION),
    where("entity", "==", entity),
    where("month", "==", month),
    where("year", "==", year)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();

    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate?.(),
    } as Budget;
  });
}