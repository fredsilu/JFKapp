import {
  collection,
  addDoc,
  getDocs,
  getDoc,
deleteDoc,  
  doc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from '../../lib/firebase';
import { CateringSimulation } from '../../types/catering';



export async function createCateringSimulation(
  simulation: Omit<
    CateringSimulation,
    'id' | 'createdAt' | 'updatedAt' | 'isDeleted'
  >
) {
  const ref = collection(db, 'catering_simulations');

  return await addDoc(ref, {
    ...simulation,
    isDeleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}


export async function getCateringSimulations() {
  const ref = collection(db, 'catering_simulations');
  const q = query(ref, where('isDeleted', '==', false));

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as CateringSimulation[];
}


export async function getCateringSimulationsByClient(
  clientId: string
) {
  const ref = collection(db, 'catering_simulations');
  const q = query(
    ref,
    where('clientId', '==', clientId),
    where('isDeleted', '==', false)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as CateringSimulation[];
}

/**
 * Supprimer une simulation traiteur
 */
export async function deleteCateringSimulation(simulationId: string) {
  await deleteDoc(doc(db, 'catering_simulations', simulationId))
}

export async function softDeleteCateringSimulation(id: string) {
  const ref = doc(db, 'catering_simulations', id);

  await updateDoc(ref, {
    isDeleted: true,
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
