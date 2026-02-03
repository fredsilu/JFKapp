import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'

/**
 * Types simples (alignés avec le reste du projet)
 */
interface Client {
  id: string
  name: string
}

interface Ingredient {
  id: string
  name: string
  quantity: number
  unit: string
  cost?: number
}

export default function CateringCalculatorScreen() {
  /** 🔗 Paramètres de navigation */
  const { reuseSimulation, clientName } = useLocalSearchParams()

  /** 🧠 États principaux */
  const [client, setClient] = useState<Client | null>(null)
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [simulationName, setSimulationName] = useState<string>('')

  /** 🔁 HYDRATATION (NOUVELLE / RÉUTILISATION) */
  useEffect(() => {
    // 🔁 Réutiliser une simulation existante
    if (reuseSimulation) {
      try {
        const sim = JSON.parse(reuseSimulation as string)

        setClient({
          id: sim.clientId ?? '',
          name: sim.clientName,
        })

        setIngredients(sim.ingredients || [])
        setSimulationName(`${sim.name ?? 'Simulation'} (copie)`)

        return
      } catch (e) {
        console.error('Erreur rechargement simulation', e)
      }
    }

    // ➕ Nouvelle simulation avec client présélectionné
    if (clientName) {
      setClient({
        id: '',
        name: clientName as string,
      })
      setSimulationName('Nouvelle simulation')
    }
  }, [reuseSimulation, clientName])

  /** 💾 Sauvegarde (placeholder – tu brancheras ton service existant) */
  function handleSaveSimulation() {
    if (!client) return

    // 👉 Ici tu appelles ton service saveSimulation(...)
    // saveSimulation({ client, ingredients, simulationName, ... })

    router.back()
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Calculateur traiteur</Text>

      {/* 👤 CLIENT */}
      <View style={styles.section}>
        <Text style={styles.label}>Client</Text>
        <Text style={styles.value}>
          {client?.name ?? 'Aucun client sélectionné'}
        </Text>
      </View>

      {/* 🧾 NOM DE LA SIMULATION */}
      <View style={styles.section}>
        <Text style={styles.label}>Nom de la simulation</Text>
        <Text style={styles.value}>{simulationName}</Text>
      </View>

      {/* 🧺 INGRÉDIENTS (PLACEHOLDER) */}
      <View style={styles.section}>
        <Text style={styles.label}>Ingrédients</Text>

        {ingredients.length === 0 ? (
          <Text style={styles.empty}>
            Aucun ingrédient pour l’instant
          </Text>
        ) : (
          ingredients.map((ing, index) => (
            <View key={index} style={styles.row}>
              <Text>{ing.name}</Text>
              <Text>
                {ing.quantity} {ing.unit}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* 💾 ACTIONS */}
      <TouchableOpacity
        style={[styles.button, !client && styles.disabled]}
        disabled={!client}
        onPress={handleSaveSimulation}
      >
        <Text style={styles.buttonText}>Enregistrer la simulation</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancel}
        onPress={() => router.back()}
      >
        <Text style={styles.cancelText}>Annuler</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },

  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },

  section: {
    marginBottom: 18,
  },

  label: {
    fontWeight: '600',
    marginBottom: 6,
  },

  value: {
    color: '#333',
  },

  empty: {
    color: '#777',
    fontStyle: 'italic',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },

  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },

  disabled: {
    backgroundColor: '#aaa',
  },

  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },

  cancel: {
    marginTop: 16,
    alignItems: 'center',
  },

  cancelText: {
    color: '#555',
  },
})
