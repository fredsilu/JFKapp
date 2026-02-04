import { db } from '@/lib/firebase';
import {
  addDoc,
  collection,
  Timestamp,doc,
  updateDoc,getDoc,
  
} from 'firebase/firestore';

import {
  CateringSimulationDraft,
  CateringSimulation,
} from '@/types/catering';


/**
 * =========================
 * COLLECTION NAME
 * =========================
 */
const COLLECTION_NAME = 'catering_simulations';

/**
 * =========================
 * VALIDATE SIMULATION
 * =========================
 */
export async function validateCateringSimulation(
  simulation: CateringSimulation
): Promise<void> {
  const ref = doc(db, 'catering_simulations', simulation.id);

  await updateDoc(ref, {
    status: 'validated',
    updatedAt: Timestamp.now(),
  });
}

export async function getCateringSimulationById(
  id: string
): Promise<CateringSimulation | null> {
  const ref = doc(db, 'catering_simulations', id);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...(snap.data() as Omit<CateringSimulation, 'id'>),
  };
}

/**
 * =========================
 * SAVE SIMULATION (DRAFT ➜ FIRESTORE)
 * =========================
 */
export async function saveCateringSimulation(
  draft: CateringSimulationDraft,
  params: {
    name: string;
    clientId: string;
  }
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
