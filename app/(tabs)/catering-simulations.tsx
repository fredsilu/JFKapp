import React, { useEffect, useMemo, useState } from 'react'
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
import { fetchClients } from '@/src/services/clientService'

import ClientDropdownFilter from '@/src/components/ClientDropdownFilter'
import ConfirmDeleteModal from '@/src/components/ConfirmDeleteModal'
import LoadingSpinner from '@/src/components/LoadingSpinner'
import ErrorMessage from '@/src/components/ErrorMessage'
import { formatCurrency } from '@/src/utils/costs'

export default function CateringSimulationsScreen() {
  const [simulations, setSimulations] = useState<CateringSimulation[]>([])
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<CateringSimulation | null>(null)

  async function loadAll() {
    try {
      setLoading(true)
      const [sims, cls] = await Promise.all([
        getCateringSimulations(),
        fetchClients(),
      ])
      setSimulations(sims)
      setClients(cls)
    } catch (e) {
      console.error(e)
      setError('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  /** 🔍 Filtrage par NOM de client (robuste) */
  const filteredSimulations = useMemo(() => {
    if (!selectedClientName) return simulations
    return simulations.filter(
      sim => sim.clientName === selectedClientName
    )
  }, [simulations, selectedClientName])

  async function confirmDelete() {
    if (!toDelete) return
    await deleteCateringSimulation(toDelete.id)
    setToDelete(null)
    loadAll()
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  return (
    <>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Simulations traiteur</Text>

        <TouchableOpacity
  style={styles.newButton}
  onPress={() => router.push('/catering-new-simulation')}
>
  <Text style={styles.newButtonText}>➕ Nouvelle simulation</Text>
</TouchableOpacity>


        {/* 🔽 FILTRE CLIENT (DROPDOWN UX PRO) */}
        <ClientDropdownFilter
          clients={clients}
          selectedClientName={selectedClientName}
          onSelect={setSelectedClientName}
        />

        {/* 🧾 LISTE DES SIMULATIONS */}
        {filteredSimulations.length === 0 ? (
          <Text style={styles.empty}>
            Aucune simulation pour ce client
          </Text>
        ) : (
          filteredSimulations.map(sim => (
            <View key={sim.id} style={styles.card}>
              <Text style={styles.name}>
                {sim.name || 'Simulation sans nom'}
              </Text>

              <Text style={styles.client}>
                Client : {sim.clientName}
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
                {/* Voir */}
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

                {/* Réutiliser */}
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

                {/* Supprimer */}
                <TouchableOpacity onPress={() => setToDelete(sim)}>
                  <Text style={[styles.link, styles.delete]}>
                    Supprimer
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* 🗑️ MODAL CONFIRMATION SUPPRESSION */}
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
    marginBottom: 12,
  },

  empty: {
    textAlign: 'center',
    color: '#777',
    marginTop: 30,
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
  newButton: {
  backgroundColor: '#007AFF',
  borderRadius: 10,
  paddingVertical: 12,
  alignItems: 'center',
  marginBottom: 16,
},
newButtonText: {
  color: '#fff',
  fontWeight: '600',
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
