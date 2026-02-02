import React, { useEffect, useState } from 'react'
import { View, Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router'

import { Client } from '@/src/services/clientService'

export default function CateringCalculatorScreen() {
  const { reuseSimulation } = useLocalSearchParams()

  const [client, setClient] = useState<Client | null>(null)
  const [ingredients, setIngredients] = useState<any[]>([])
  const [simulationName, setSimulationName] = useState('')

  // 🔁 RECHARGEMENT DE LA SIMULATION
  useEffect(() => {
    if (!reuseSimulation) return

    try {
      const sim = JSON.parse(reuseSimulation as string)

      setClient({
        id: sim.clientId,
        name: sim.clientName,
      })

      setIngredients(sim.ingredients || [])
      setSimulationName(`${sim.name} (copie)`)

    } catch (e) {
      console.error('Erreur rechargement simulation', e)
    }
  }, [reuseSimulation])

  return (
    <View>
      <Text>Calculateur traiteur</Text>

      {/* 
        👉 Le reste de ton calculateur EXISTANT reste IDENTIQUE :
        - sélection plats
        - calcul ingrédients
        - calcul coûts
        - bouton "Enregistrer la simulation"
      */}
    </View>
  )
}
