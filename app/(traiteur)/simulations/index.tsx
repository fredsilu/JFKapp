//app/(traiteur)/simulations/index.tsx
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  BackHandler,
  TextInput,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons as Icon } from '@expo/vector-icons';


import {
  deleteCateringSimulation,
  getCateringSimulations,
} from '@/src/services/cateringSimulation.service';
import { CateringSimulation } from '@/types/catering';
import { fetchClients } from '@/src/services/clientService';


import ConfirmDeleteModal from '@/src/components/ConfirmDeleteModal';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import ErrorMessage from '@/src/components/ErrorMessage';

export default function CateringSimulationsScreen() {
  const router = useRouter();

  const [simulations, setSimulations] = useState<CateringSimulation[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);

  const [searchQuery, setSearchQuery] = useState('');

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
      const onBackPress = () => {
        if (toDelete) {
          setToDelete(null);
          return true;
        }

        router.replace('/(traiteur)/sales');
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => subscription.remove();
    }, [toDelete, router])
  );

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  function getMillis(value: any): number {
    if (!value) return 0;

    if (value?.toMillis) {
      return value.toMillis();
    }

    if (value?.toDate) {
      return value.toDate().getTime();
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }

  function normalizeText(value: any): string {
    return String(value ?? '').trim().toLowerCase();
  }

  function formatTimestamp(value: any): string {
    const millis = getMillis(value);

    if (!millis) return 'Non définie';

    return new Date(millis).toLocaleDateString('fr-FR');
  }

  const filteredSimulations = useMemo(() => {
    const q = normalizeText(searchQuery);

    return [...simulations]
      .filter((sim) => {
        if (!q) return true;

        const clientLabel = clientsById[sim.clientId] || sim.clientId || '';

        return [
          sim.name,
          sim.clientId,
          clientLabel,
          sim.designation,
          sim.dateLivraison,
          sim.deliveryAddress,
          sim.deliveryTime,
          sim.comment,
          sim.status,
          sim.globalTurnover,
          sim.globalCost,
          sim.globalMargin,
        ]
          .map(normalizeText)
          .join(' ')
          .includes(q);
      })
      .sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt));
  }, [simulations, searchQuery, clientsById]);

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

        {/* BACK BUTTON */}
        <TouchableOpacity
          onPress={() => router.replace('/(traiteur)/sales')}
          style={styles.backPill}
          activeOpacity={0.75}
        >
          <Icon name="arrow-back" size={18} color="#0F4C81" />
          <Text style={styles.backPillText}>
            Retour aux ventes
          </Text>
        </TouchableOpacity>

        <Text style={styles.title}>Simulations traiteur</Text>

        <TouchableOpacity
          style={styles.newButton}
          onPress={() =>
            router.push({
              pathname: '/(traiteur)/simulations/new',
              params: {
                backTo: '/(traiteur)/simulations',
              },
            })
          }
        >
          <Text style={styles.newButtonText}>➕ Nouvelle simulation</Text>
        </TouchableOpacity>


        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher simulation, client, date, montant..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

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

                <View style={styles.datesBlock}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      Créée le : {formatTimestamp(sim.createdAt)}
                    </Text>
                  </View>

                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      Livraison : {formatDate(sim.dateLivraison)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.createProformaBtn}
                  onPress={() =>
                    router.push({
                      pathname: '/(traiteur)/proformas/create-from-simulation',
                      params: {
                        simulationId: sim.id,
                        backTo: '/(traiteur)/simulations',
                      },
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
                        params: {
                          id: sim.id,
                          backTo: '/(traiteur)/simulations',
                        },
                      })
                    }
                  >
                    <Text style={styles.link}>Voir</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: '/(traiteur)/tools/calculator-v2',
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  backIcon: {
    fontSize: 24,
    marginRight: 10,
    color: '#111827',
  },

  backText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  backPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 12,
  },

  backPillText: {
    color: '#0F4C81',
    fontSize: 14,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },

  datesBlock: {
    marginTop: 8,
    gap: 6,
  },
});