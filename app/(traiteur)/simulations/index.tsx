// app/(traiteur)/simulations/index.tsx
import React, { useCallback, useMemo, useState } from 'react';
import {
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import MobileListHeader from "@/src/components/mobile/MobileListHeader";
import MobileStatsBar from "@/src/components/mobile/MobileStatsBar";
import MobileSearchBar from "@/src/components/mobile/MobileSearchBar";
import MobileFilterBar from "@/src/components/mobile/MobileFilterBar";


import {
  deleteCateringSimulation,
  getCateringSimulations,
} from '@/src/services/cateringSimulation.service';
import { CateringSimulation } from '@/types/catering';
import { fetchClients } from '@/src/services/clientService';

import ConfirmDeleteModal from '@/src/components/ConfirmDeleteModal';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import ErrorMessage from '@/src/components/ErrorMessage';
import { formatShortDocumentDate } from '@/src/utils/dateFormat';

export default function CateringSimulationsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1024;

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
    if (value?.toMillis) return value.toMillis();
    if (value?.toDate) return value.toDate().getTime();

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }

  function normalizeText(value: any): string {
    return String(value ?? '').trim().toLowerCase();
  }

  function displayDate(value: any): string {
    if (!value) return '—';

    if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      return value;
    }

    return formatShortDocumentDate(value);
  }

  function formatAmount(value?: number) {
    if (!value) return '0,00 $';

    return `${value.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} $`;
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

  const stats = useMemo(() => {
    const totalSimulations = filteredSimulations.length;

    const totalPeople = filteredSimulations.reduce(
      (sum, sim) => sum + Number(sim.guestCount || 0),
      0
    );

    const totalTurnover = filteredSimulations.reduce(
      (sum, sim) => sum + Number(sim.globalTurnover || sim.totals?.grandTotal || 0),
      0
    );

    const convertedCount = filteredSimulations.filter(
      (sim) => sim.convertedToOrder
    ).length;

    return {
      totalSimulations,
      totalPeople,
      totalTurnover,
      convertedCount,
    };
  }, [filteredSimulations]);

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

  function goToNewSimulation() {
    router.push({
      pathname: '/(traiteur)/simulations/new',
      params: {
        backTo: '/(traiteur)/simulations',
      },
    });
  }

  function openSimulation(simulationId: string) {
    router.push({
      pathname: '/(traiteur)/simulations/[id]',
      params: {
        id: simulationId,
        backTo: '/(traiteur)/simulations',
      },
    });
  }

  function reuseSimulation(simulationId: string) {
    router.push({
      pathname: "/(traiteur)/tools/calculator-v2",
      params: {
        mode: "reuse",
        reuseSimulationId: simulationId,
        sessionId: `reuse_${simulationId}_${Date.now()}`,
        backTo: "/(traiteur)/simulations",
      },
    });
  }

  function createProforma(simulationId: string) {
    router.push({
      pathname: '/(traiteur)/proformas/create-from-simulation',
      params: {
        simulationId,
        backTo: '/(traiteur)/simulations',
      },
    });
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  const RootContainer: any = isDesktop ? ScrollView : View;

  return (
    <>
      <RootContainer
        style={styles.container}
        {...(isDesktop
          ? { contentContainerStyle: [styles.content, styles.desktopContent] }
          : {})}
      >
        <View style={!isDesktop ? styles.mobileStickyControls : undefined}>
          {isDesktop ? (
            <>
              <TouchableOpacity
                onPress={() => router.replace('/(traiteur)/sales')}
                style={styles.backPill}
                activeOpacity={0.75}
              >
                <Icon name="arrow-back" size={18} color="#0F4C81" />
                <Text style={styles.backPillText}>Retour aux ventes</Text>
              </TouchableOpacity>

              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.title}>Simulations traiteur</Text>
                  <Text style={styles.subtitle}>
                    Gérez vos simulations et créez des proformas.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.desktopNewButton}
                  onPress={goToNewSimulation}
                >
                  <Icon name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.newButtonText}>Nouvelle simulation</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <MobileListHeader
              title="Simulations"
              total={stats.totalSimulations}
              onBack={() => router.replace('/(traiteur)/sales')}
              onAdd={goToNewSimulation}
            />
          )}

          {isDesktop ? (
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Icon name="list-alt" size={24} color="#007AFF" />
                <View>
                  <Text style={styles.statLabel}>Total simulations</Text>
                  <Text style={styles.statValue}>{stats.totalSimulations}</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <Icon name="attach-money" size={24} color="#16A34A" />
                <View>
                  <Text style={styles.statLabel}>CA potentiel</Text>
                  <Text style={styles.statValue}>
                    {formatAmount(stats.totalTurnover)}
                  </Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <Icon name="groups" size={24} color="#7C3AED" />
                <View>
                  <Text style={styles.statLabel}>Total personnes</Text>
                  <Text style={styles.statValue}>{stats.totalPeople}</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <Icon name="description" size={24} color="#EA580C" />
                <View>
                  <Text style={styles.statLabel}>Converties</Text>
                  <Text style={styles.statValue}>{stats.convertedCount}</Text>
                </View>
              </View>
            </View>
          ) : (
            <MobileStatsBar
              items={[
                { label: "Total", value: stats.totalSimulations },
                { label: "CA potentiel", value: formatAmount(stats.totalTurnover), wide: true },
                { label: "Personnes", value: stats.totalPeople },
                { label: "Converties", value: stats.convertedCount },
              ]}
            />
          )}

          {isDesktop ? (
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
          ) : (
            <MobileSearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Rechercher une simulation..." />
          )}

        </View>

        <ScrollView
          style={!isDesktop ? styles.mobileListScroll : undefined}
          contentContainerStyle={!isDesktop ? styles.mobileListContent : undefined}
          nestedScrollEnabled
          scrollEnabled={!isDesktop}
          showsVerticalScrollIndicator={false}
        >
          {filteredSimulations.length === 0 ? (
            <Text style={styles.empty}>Aucune simulation</Text>
          ) : isDesktop ? (
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.th, styles.colName]}>Simulation</Text>
                  <Text style={[styles.th, styles.colClient]}>Client</Text>
                  <Text style={[styles.th, styles.colPeople]}>Pers.</Text>
                  <Text style={[styles.th, styles.colDate]}>Livraison</Text>
                  <Text style={[styles.th, styles.colTime]}>Heure</Text>
                  <Text style={[styles.th, styles.colAmount]}>Montant</Text>
                  <Text style={[styles.th, styles.colDate]}>Créée le</Text>
                  <Text style={[styles.th, styles.colActions]}>Actions</Text>
                </View>

                {filteredSimulations.map((sim) => {
                  const clientLabel =
                    clientsById[sim.clientId] || sim.clientId || '-';

                  const amount =
                    sim.globalTurnover || sim.totals?.grandTotal || 0;

                  return (
                    <View key={sim.id} style={styles.tableRow}>
                      <View style={styles.colName}>
                        <Text style={styles.tableName} numberOfLines={1}>
                          {sim.name || 'Simulation sans nom'}
                        </Text>
                        <Text style={styles.tableSubText} numberOfLines={1}>
                          {sim.designation || sim.status || '—'}
                        </Text>
                      </View>

                      <Text style={[styles.td, styles.colClient]} numberOfLines={1}>
                        {clientLabel}
                      </Text>

                      <Text style={[styles.td, styles.colPeople]}>
                        {sim.guestCount ?? 0}
                      </Text>

                      <Text style={[styles.td, styles.colDate]}>
                        {displayDate(sim.dateLivraison)}
                      </Text>

                      <Text style={[styles.td, styles.colTime]}>
                        {sim.deliveryTime || '—'}
                      </Text>

                      <Text style={[styles.td, styles.colAmount]}>
                        {formatAmount(amount)}
                      </Text>

                      <Text style={[styles.td, styles.colDate]}>
                        {formatShortDocumentDate(sim.createdAt)}
                      </Text>

                      <View style={[styles.rowActions, styles.colActions]}>
                        <TouchableOpacity
                          style={styles.smallActionButton}
                          onPress={() => openSimulation(sim.id)}
                        >
                          <Icon name="visibility" size={16} color="#007AFF" />
                          <Text style={styles.smallActionText}>Voir</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.smallActionButton}
                          onPress={() => reuseSimulation(sim.id)}
                        >
                          <Icon name="refresh" size={16} color="#007AFF" />
                          <Text style={styles.smallActionText}>Réutiliser</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.proformaActionButton}
                          onPress={() => createProforma(sim.id)}
                        >
                          <Icon name="description" size={16} color="#16A34A" />
                          <Text style={styles.proformaActionText}>Proforma</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.deleteActionButton}
                          onPress={() => setToDelete(sim)}
                        >
                          <Icon name="delete" size={16} color="#DC2626" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          ) : (
            filteredSimulations.map((sim) => {
              const clientLabel = clientsById[sim.clientId] || sim.clientId || '-';

              return (
                <View key={sim.id} style={styles.card}>
                  <Text style={styles.name}>{sim.name || 'Simulation sans nom'}</Text>

                  <Text style={styles.client}>Client : {clientLabel}</Text>

                  <Text style={styles.client}>
                    Nombre de personnes : {sim.guestCount ?? 0}
                  </Text>

                  <View style={styles.datesBlock}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        Créée le : {formatShortDocumentDate(sim.createdAt)}
                      </Text>
                    </View>

                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        Livraison : {displayDate(sim.dateLivraison)}
                      </Text>
                    </View>

                    {sim.deliveryTime ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          Heure : {sim.deliveryTime}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    style={styles.createProformaBtn}
                    onPress={() => createProforma(sim.id)}
                  >
                    <Text style={styles.createProformaText}>Créer proforma</Text>
                  </TouchableOpacity>

                  <View style={styles.actions}>
                    <TouchableOpacity onPress={() => openSimulation(sim.id)}>
                      <Text style={styles.link}>Voir</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => reuseSimulation(sim.id)}>
                      <Text style={styles.link}>Réutiliser</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setToDelete(sim)}>
                      <Text style={[styles.link, styles.delete]}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

        </ScrollView>
        {isDesktop ? <View style={{ height: 30 }} /> : null}
      </RootContainer>

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
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
  },

  content: {
    flexGrow: 1,
    paddingBottom: 0,
  },

  desktopContent: {
    paddingBottom: 30,
    width: '100%',
    maxWidth: 1500,
    alignSelf: 'center',
  },


  mobileHeader: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  mobileBackButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#EEF6FF",
  },

  mobileTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },

  mobileHeaderSpacer: { width: 40 },

  mobileAddButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#007AFF",
  },

  mobileStatsRow: {
    gap: 8,
    paddingBottom: 10,
  },

  mobileStatCard: {
    minWidth: 78,
    height: 58,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },

  mobileStatCardWide: {
    minWidth: 118,
    height: 58,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },

  mobileStatValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  mobileStatAmount: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  mobileStatLabel: {
    color: "#D1D5DB",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
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
    marginBottom: 20,
  },

  backPillText: {
    color: '#0F4C81',
    fontSize: 14,
    fontWeight: '700',
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 16,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
  },

  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },

  newButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },

  desktopNewButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  newButtonText: {
    color: '#fff',
    fontWeight: '700',
  },

  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },

  statCard: {
    flex: 1,
    minHeight: 86,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },

  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
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

  empty: {
    textAlign: 'center',
    color: '#777',
    marginTop: 30,
  },

  table: {
    minWidth: 1450,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  tableHeader: {
    flexDirection: 'row',
    minHeight: 44,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  tableRow: {
    flexDirection: 'row',
    minHeight: 66,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  th: {
    fontSize: 13,
    fontWeight: '800',
    color: '#374151',
    paddingHorizontal: 12,
  },

  td: {
    fontSize: 13,
    color: '#111827',
    paddingHorizontal: 12,
  },

  colName: {
    width: 230,
    paddingHorizontal: 12,
  },

  colClient: {
    width: 170,
  },

  colPeople: {
    width: 90,
    textAlign: 'center',
  },

  colDate: {
    width: 130,
  },

  colTime: {
    width: 90,
  },

  colAmount: {
    width: 140,
    textAlign: 'right',
  },

  colActions: {
    width: 470,
  },

  tableName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },

  tableSubText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
  },

  rowActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },

  smallActionButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  smallActionText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '700',
  },

  proformaActionButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  proformaActionText: {
    color: '#16A34A',
    fontSize: 13,
    fontWeight: '700',
  },

  deleteActionButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  name: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },

  client: {
    marginTop: 6,
    color: '#555',
    fontSize: 14,
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
    marginTop: 12,
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },

  createProformaText: {
    color: '#fff',
    fontWeight: '700',
  },

  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
    marginTop: 16,
  },

  link: {
    color: '#007AFF',
    fontWeight: '600',
  },

  delete: {
    color: '#d9534f',
  },

  datesBlock: {
    marginTop: 8,
    gap: 6,
  },

  mobileStickyControls: {
    backgroundColor: "#F4F6F8",
    paddingTop: 2,
    paddingBottom: 6,
    zIndex: 1,
  },
  mobileListScroll: {
    flex: 1,
    overflow: "hidden",
  },
  mobileListContent: {
    paddingTop: 8,
    paddingBottom: 30,
  },
});