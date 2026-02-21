import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { EntityType } from "@/types/finance.types";

const COLLECTION_NAME = "finance_forecasts";

export interface Forecast {
  id?: string;
  entity: EntityType;
  type: "income" | "expense";
  amount: number;
  currency: "USD" | "CDF";
  plannedDate: Date;
  category: string;
  accountId?: string;
  linkedTransactionId?: string;
  description?: string;
  isExecuted: boolean;
  createdAt: Date;
}

/* ============================= */
/*        CREATE FORECAST        */
/* ============================= */

export async function createForecast(
  forecast: Omit<Forecast, "id" | "createdAt" | "isExecuted">
) {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...forecast,
    plannedDate: Timestamp.fromDate(forecast.plannedDate),
    isExecuted: false,
    createdAt: Timestamp.now(),
  });

  return docRef.id;
}

/* ============================= */
/*       GET BY ENTITY           */
/* ============================= */

export async function getForecastByEntity(
  entity: EntityType
) {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("entity", "==", entity),
    orderBy("plannedDate", "asc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();

    return {
      id: docSnap.id,
      ...data,
      plannedDate: data.plannedDate?.toDate(),
      createdAt: data.createdAt?.toDate(),
    } as Forecast;
  });
}

/* ============================= */
/*     MARK AS EXECUTED          */
/* ============================= */

export async function markForecastExecuted(
  forecastId: string,
  transactionId: string
) {
  await updateDoc(doc(db, COLLECTION_NAME, forecastId), {
    isExecuted: true,
    linkedTransactionId: transactionId,
  });
}