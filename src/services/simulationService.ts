import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Client } from '@/types'


export interface SimulationInput {
  client: Client
  simulationName: string
  description?: string
  totalCost: number
  ingredients: any[]
}

export async function saveSimulation(data: SimulationInput) {
  await addDoc(collection(db, 'catering_simulations'), {
    clientId: data.client.id,
    clientName: data.client.name,
    simulationName: data.simulationName,
    description: data.description || '',
    totalCost: data.totalCost,
    ingredients: data.ingredients,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}
