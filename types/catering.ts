import { Timestamp } from 'firebase/firestore';

/**
 * Représente une simulation de catering
 */
export interface CateringSimulation {
  id: string;

  // Métadonnées
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isDeleted: boolean;

  // Données métier (à ajuster selon ton besoin réel)
  name: string;
  numberOfGuests: number;
  costPerGuest: number;
  totalCost: number;

  notes?: string;
}
