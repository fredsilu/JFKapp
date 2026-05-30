//src/services/cateringSimulation.service.ts
import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { CateringSimulation } from '@/types/catering';

const COLLECTION = 'catering_simulations';

/* ================================
   GET ALL SIMULATIONS (non supprimées)
================================ */
export async function getCateringSimulations(): Promise<CateringSimulation[]> {
  const q = query(
    collection(db, COLLECTION),
    where('isDeleted', '==', false)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<CateringSimulation, 'id'>),
  }));
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

  return {
    id: snap.id,
    ...(snap.data() as Omit<CateringSimulation, 'id'>),
  };
}

/* ================================
   CREATE SIMULATION
================================ */
export async function createCateringSimulation(
  simulation: Omit<
    CateringSimulation,
    'id' | 'createdAt' | 'updatedAt'
  >
) {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...simulation,

    // 🔥 Sécurisation champs système
    isDeleted: false,
    convertedToOrder: false,

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
) {
  const ref = doc(db, COLLECTION, id);

  await updateDoc(ref, {
    ...simulation,
    updatedAt: serverTimestamp(),
  });
}

/* ================================
   SOFT DELETE SIMULATION
================================ */
export async function softDeleteCateringSimulation(id: string) {
  const ref = doc(db, COLLECTION, id);

  await updateDoc(ref, {
    isDeleted: true,
    updatedAt: serverTimestamp(),
  });
}

/* ================================
   HARD DELETE (optionnel)
================================ */
export async function deleteCateringSimulation(id: string) {
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
}

/* ================================
   MARK AS CONVERTED
================================ */
export async function markSimulationAsConverted(
  id: string,
  orderId?: string
) {
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
  if (!simulation) return '';

  const data = simulation as any;

  return (
    data.eventName ||
    data.name ||
    data.title ||
    ''
  );
}