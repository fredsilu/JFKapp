import { db } from '@/lib/firebase';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  where,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';

import {
  CateringSimulationDraft,
  CateringSimulation,
} from '@/types/catering';

const COLLECTION_NAME = 'catering_simulations';

/**
 * =========================
 * SAVE SIMULATION (DRAFT ➜ FIRESTORE)
 * =========================
 */
export async function saveCateringSimulation(
  draft: CateringSimulationDraft,
  params: { name: string; clientId: string }
): Promise<CateringSimulation> {
  const now = Timestamp.now();

  const simulationToSave: Omit<CateringSimulation, 'id'> = {
    ...draft,

    name: params.name,
    clientId: params.clientId,

    createdAt: now,
    updatedAt: now,
    isDeleted: false,
    status: 'draft',
  };

  const docRef = await addDoc(
    collection(db, COLLECTION_NAME),
    simulationToSave
  );

  return {
    id: docRef.id,
    ...simulationToSave,
  };
}

/**
 * =========================
 * GET ALL SIMULATIONS (NOT DELETED)
 * =========================
 */
export async function getCateringSimulations(): Promise<CateringSimulation[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('isDeleted', '==', false),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<CateringSimulation, 'id'>),
  }));
}

/**
 * =========================
 * GET ONE SIMULATION BY ID
 * =========================
 */
export async function getCateringSimulationById(
  id: string
): Promise<CateringSimulation | null> {
  const ref = doc(db, COLLECTION_NAME, id);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...(snap.data() as Omit<CateringSimulation, 'id'>),
  };
}

/**
 * =========================
 * VALIDATE SIMULATION
 * =========================
 */
export async function validateCateringSimulation(
  simulation: CateringSimulation
): Promise<void> {
  const ref = doc(db, COLLECTION_NAME, simulation.id);

  await updateDoc(ref, {
    status: 'validated',
    updatedAt: Timestamp.now(),
  });
}

/**
 * =========================
 * SOFT DELETE SIMULATION
 * =========================
 */
export async function deleteCateringSimulation(
  id: string
): Promise<void> {
  const ref = doc(db, COLLECTION_NAME, id);

  await updateDoc(ref, {
    isDeleted: true,
    updatedAt: Timestamp.now(),
  });
}
