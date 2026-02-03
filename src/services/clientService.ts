import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface Client {
  id: string
  name: string
}

export async function fetchClients(): Promise<Client[]> {
  const q = query(collection(db, 'clients'), orderBy('name'))
  const snapshot = await getDocs(q)

  return snapshot.docs.map(d => ({
    id: d.id,
    name: d.data().name,
  }))
}
