// src/services/cateringSimulation.service.ts
import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { CateringSimulation } from "@/types/catering";

const COLLECTION = "catering_simulations";

function mapSimulationDoc(docSnap: any): CateringSimulation {
  return {
    id: docSnap.id,
    ...(docSnap.data() as Omit<CateringSimulation, "id">),
  };
}

/* ================================
   GET ALL SIMULATIONS
================================ */
export async function getCateringSimulations(): Promise<CateringSimulation[]> {
  const snapshot = await getDocs(collection(db, COLLECTION));

  return snapshot.docs
    .map(mapSimulationDoc)
    .filter((simulation: any) => simulation.isDeleted !== true);
}

/* ================================
   GET ONE SIMULATION BY ID
================================ */
export async function getSimulationById(
  id: string
): Promise<CateringSimulation | null> {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const simulation = mapSimulationDoc(snap);

  if ((simulation as any).isDeleted === true) return null;

  return simulation;
}

/* ================================
   CREATE SIMULATION
================================ */
export async function createCateringSimulation(
  simulation: Omit<CateringSimulation, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...simulation,

    // Compatible V2 sections[]
    sections: (simulation as any).sections ?? [],

    isDeleted: false,
    convertedToOrder: false,
    orderId: null,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

/* ================================
   UPDATE SIMULATION
================================ */
export async function updateCateringSimulation(
  id: string,
  simulation: Partial<CateringSimulation>
): Promise<void> {
  const ref = doc(db, COLLECTION, id);

  const { id: _id, createdAt, updatedAt, ...safeData } = simulation as any;

  await updateDoc(ref, {
    ...safeData,

    // Compatible V2 sections[]
    sections: safeData.sections ?? [],

    updatedAt: serverTimestamp(),
  });
}

/* ================================
   SOFT DELETE SIMULATION
================================ */
export async function softDeleteCateringSimulation(id: string): Promise<void> {
  const ref = doc(db, COLLECTION, id);

  await updateDoc(ref, {
    isDeleted: true,
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/* ================================
   HARD DELETE
================================ */
export async function deleteCateringSimulation(id: string): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
}

/* ================================
   MARK AS CONVERTED
================================ */
export async function markSimulationAsConverted(
  id: string,
  orderId?: string
): Promise<void> {
  const ref = doc(db, COLLECTION, id);

  await updateDoc(ref, {
    convertedToOrder: true,
    orderId: orderId ?? null,
    convertedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/* ================================
   GET SIMULATION EVENT NAME
================================ */
export function getSimulationEventName(
  simulation: CateringSimulation | null | undefined
): string {
  if (!simulation) return "";

  const data = simulation as any;

  return data.eventName || data.name || data.title || "";
}