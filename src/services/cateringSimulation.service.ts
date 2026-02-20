import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { CateringSimulation } from '@/types/catering';

const COLLECTION = 'catering_simulations';

/* ================================
   GET ALL SIMULATIONS
================================ */
export async function getCateringSimulations(): Promise<CateringSimulation[]> {
  const snapshot = await getDocs(collection(db, COLLECTION));

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
  simulation: Partial<CateringSimulation>
) {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...simulation,
    createdAt: serverTimestamp(),
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
  await updateDoc(ref, simulation);
}

/* ================================
   DELETE SIMULATION
================================ */
export async function deleteCateringSimulation(id: string) {
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
}
