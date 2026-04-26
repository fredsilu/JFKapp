import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';

import {
  deleteCateringSimulation,
  getCateringSimulations,
} from '@/src/services/cateringSimulation.service';
import { CateringSimulation } from '@/types/catering';
import { fetchClients } from '@/src/services/clientService';

import ClientDropdownFilter, {
  ClientFilterValue,
} from '@/src/components/ClientDropdownFilter';
import ConfirmDeleteModal from '@/src/components/ConfirmDeleteModal';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import ErrorMessage from '@/src/components/ErrorMessage';

export default function CateringSimulationsScreen() {
  const router = useRouter();

  const [simulations, setSimulations] = useState<CateringSimulation[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [selectedClientId, setSelectedClientId] =
    useState<ClientFilterValue>('ALL');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<CateringSimulation | null>(null);

  const clientsById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of clients) map[c.id] = c.name;
    return map;
  }, [clients]);

  const loadAll = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const [sims, cls] = await Promise.all([
        getCateringSimulations(),
        fetchClients(),
      ]);

      setSimulations(sims);
      setClients(cls);
    } catch (e) {
      console.error('❌ loadAll error:', e);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  const filteredSimulations = useMemo(() => {
    const list =
      !selectedClientId || selectedClientId === 'ALL'
        ? simulations
        : simulations.filter((sim) => sim.clientId === selectedClientId);

    return [...list].sort((a, b) =>
      (a.dateLivraison || '').localeCompare(b.dateLivraison || '')
    );
  }, [simulations, selectedClientId]);

  function formatDate(date?: string) {
    if (!date) return 'Non définie';

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
      return date;
    }

    return d.toLocaleDateString('fr-FR');
  }

  async function confirmDelete() {
    if (!toDelete) return;

    try {
      await deleteCateringSimulation(toDelete.id);
      setToDelete(null);
      await loadAll();
    } catch (e) {
      console.error('❌ delete error:', e);
      setError('Erreur lors de la suppression de la simulation');
    }
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Simulations traiteur</Text>

        <TouchableOpacity
          style={styles.newButton}
          onPress={() => router.push('/(traiteur)/simulations/new')}
        >
          <Text style={styles.newButtonText}>➕ Nouvelle simulation</Text>
        </TouchableOpacity>

        <ClientDropdownFilter
          clients={clients}
          selectedClientId={selectedClientId}
          onSelect={setSelectedClientId}
          labelAll="Tous les clients"
        />

        {filteredSimulations.length === 0 ? (
          <Text style={styles.empty}>Aucune simulation</Text>
        ) : (
          filteredSimulations.map((sim) => {
            const clientLabel = clientsById[sim.clientId] || sim.clientId || '-';

            return (
              <View key={sim.id} style={styles.card}>
                <Text style={styles.name}>
                  {sim.name || 'Simulation sans nom'}
                </Text>

                <Text style={styles.client}>Client : {clientLabel}</Text>

                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    📅 {formatDate(sim.dateLivraison)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.createProformaBtn}
                  onPress={() =>
                    router.push({
                      pathname:
                        '/(traiteur)/proformas/create-from-simulation',
                      params: { simulationId: sim.id },
                    })
                  }
                >
                  <Text style={styles.createProformaText}>
                    Créer proforma
                  </Text>
                </TouchableOpacity>

                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: '/(traiteur)/simulations/[id]',
                        params: { id: sim.id },
                      })
                    }
                  >
                    <Text style={styles.link}>Voir</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: '/(traiteur)/tools/calculator',
                        params: {
                          reuseSimulationId: sim.id,
                          backTo: '/(traiteur)/simulations',
                        },
                      })
                    }
                  >
                    <Text style={styles.link}>Réutiliser</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setToDelete(sim)}>
                    <Text style={[styles.link, styles.delete]}>
                      Supprimer
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      <ConfirmDeleteModal
        visible={!!toDelete}
        title="Supprimer la simulation"
        message={`Supprimer la simulation "${toDelete?.name || ''}" ?`}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
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

  newButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },

  newButtonText: {
    color: '#fff',
    fontWeight: '700',
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
    fontWeight: '700',
  },

  client: {
    marginTop: 4,
    color: '#555',
  },

  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F0FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },

  badgeText: {
    color: '#1A73E8',
    fontSize: 12,
    fontWeight: '600',
  },

  createProformaBtn: {
    marginTop: 10,
    backgroundColor: '#28a745',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  createProformaText: {
    color: '#fff',
    fontWeight: '700',
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },

  link: {
    color: '#007AFF',
    fontWeight: '600',
  },

  delete: {
    color: '#d9534f',
  },
});