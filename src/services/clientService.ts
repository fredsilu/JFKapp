import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Client } from '@/types';

export async function fetchClients(): Promise<Client[]> {
  const q = query(collection(db, 'clients'), orderBy('name'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => {
    const data = d.data();

    return {
      id: d.id,
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',

      // ✅ champs manquants
      rccm: data.rccm || '',
      idNat: data.idNat || '',
      city: data.city || '',

      notes: data.notes || '',
      totalOrders: data.totalOrders || 0,
      lastOrderDate: data.lastOrderDate?.toDate?.(),
      createdAt: data.createdAt?.toDate?.(),
      updatedAt: data.updatedAt?.toDate?.(),
      profilePicture: data.profilePicture || '',
    } as Client;
  });
}