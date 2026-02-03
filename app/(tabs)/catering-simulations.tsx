import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { router } from 'expo-router'

import {
  getCateringSimulations,
  deleteCateringSimulation,
} from '@/src/services/cateringSimulations'
import { CateringSimulation } from '@/types/catering'
import LoadingSpinner from '@/src/components/LoadingSpinner'
import ErrorMessage from '@/src/components/ErrorMessage'
import ConfirmDeleteModal from '@/src/components/ConfirmDeleteModal'
import { formatCurrency } from '@/src/utils/costs'

export default function CateringSimulationsScreen() {
  const [simulations, setSimulations] = useState<CateringSimulation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [toDelete, setToDelete] = useState<CateringSimulation | null>(null)

  async function loadSimulations() {
    try {
      setLoading(true)
      const data = await getCateringSimulations()
      setSimulations(data)
    } catch (err) {
      setError('Erreur lors du chargement des simulations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSimulations()
  }, [])

  async function confirmDelete() {
    if (!toDelete) return

    await deleteCateringSimulation(toDelete.id)
    setToDelete(null)
    loadSimulations()
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  return (
    <>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Simulations traiteur</Text>

        {simulations.map(sim => (
          <View key={sim.id} style={styles.card}>
            <Text style={styles.name}>{sim.name}</Text>

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
                    pathname: '/catering-simulation-details',
                    params: { simulation: JSON.stringify(sim) },
                  })
                }
              >
                <Text style={styles.link}>Voir</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/catering-calculator',
                    params: { reuseSimulation: JSON.stringify(sim) },
                  })
                }
              >
                <Text style={styles.link}>Réutiliser</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setToDelete(sim)}>
                <Text style={[styles.link, styles.delete]}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <ConfirmDeleteModal
        visible={!!toDelete}
        title="Supprimer la simulation"
        message={`Supprimer la simulation "${toDelete?.name}" ?`}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  link: {
    color: '#007AFF',
    fontWeight: '500',
  },
  delete: {
    color: '#d9534f',
  },
})
