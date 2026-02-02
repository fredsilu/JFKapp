import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { router } from 'expo-router'

import { getCateringSimulations } from '@/src/services/cateringSimulations'
import { CateringSimulation } from '@/types/catering'
import LoadingSpinner from '@/src/components/LoadingSpinner'
import ErrorMessage from '@/src/components/ErrorMessage'
import { formatCurrency } from '@/src/utils/costs'

export default function CateringSimulationsScreen() {
  const [simulations, setSimulations] = useState<CateringSimulation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await getCateringSimulations()
        setSimulations(data)
      } catch (e) {
        setError('Erreur lors du chargement des simulations')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Simulations traiteur</Text>

      {simulations.length === 0 && (
        <Text style={styles.empty}>Aucune simulation enregistrée</Text>
      )}

      {simulations.map(sim => (
        <View key={sim.id} style={styles.card}>
          <Text style={styles.name}>
            {sim.name || 'Simulation sans nom'}
          </Text>

          <Text style={styles.client}>
            Client : {sim.clientName ?? '—'}
          </Text>

          <View style={styles.row}>
            <Text style={styles.amount}>
              CA : {formatCurrency(sim.results?.totals?.totalRevenue ?? 0)}
            </Text>
            <Text style={styles.amount}>
              Bénéfice : {formatCurrency(sim.results?.totals?.totalProfit ?? 0)}
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/catering-calculator',
                  params: {
                    reuseSimulation: JSON.stringify(sim),
                  },
                })
              }
            >
              <Text style={styles.link}>Réutiliser</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
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
    marginBottom: 16,
  },
  empty: {
    textAlign: 'center',
    color: '#777',
    marginTop: 40,
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  client: {
    marginTop: 4,
    color: '#555',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  amount: {
    fontWeight: '500',
  },
  actions: {
    marginTop: 12,
  },
  link: {
    color: '#007AFF',
    fontWeight: '500',
  },
})
