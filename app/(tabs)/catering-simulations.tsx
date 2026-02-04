import { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { useRouter } from 'expo-router'

import {
  getCateringSimulations,
  deleteCateringSimulation,
} from '@/src/services/cateringSimulation.service'
import { CateringSimulation } from '@/types/catering'
import { fetchClients } from '@/src/services/clientService'

import ClientDropdownFilter from '@/src/components/ClientDropdownFilter'
import ConfirmDeleteModal from '@/src/components/ConfirmDeleteModal'
import LoadingSpinner from '@/src/components/LoadingSpinner'
import ErrorMessage from '@/src/components/ErrorMessage'

export default function CateringSimulationsScreen() {
  const router = useRouter()

  const [simulations, setSimulations] = useState<CateringSimulation[]>([])
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

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

  /** 🔍 Filtrage par client */
  const filteredSimulations = useMemo(() => {
    if (!selectedClientId) return simulations
    return simulations.filter(
      sim => sim.clientId === selectedClientId
    )
  }, [simulations, selectedClientId])

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

        {/* ➕ NOUVELLE SIMULATION */}
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => router.push('/catering-calculator')}
        >
          <Text style={styles.newButtonText}>
            ➕ Nouvelle simulation
          </Text>
        </TouchableOpacity>

        {/* 🔽 FILTRE CLIENT */}
        <ClientDropdownFilter
          clients={clients}
          selectedClientId={selectedClientId}
          onSelect={setSelectedClientId}
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
                Client : {sim.clientId}
              </Text>

              <Text style={styles.meta}>
                Statut : {sim.status}
              </Text>

              <View style={styles.actions}>
                {/* Voir / Réutiliser */}
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/catering-calculator',
                      params: { simulationId: sim.id },
                    })
                  }
                >
                  <Text style={styles.link}>
                    Ouvrir / Réutiliser
                  </Text>
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

  meta: {
    marginTop: 4,
    color: '#777',
    fontSize: 13,
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
