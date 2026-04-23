import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { formatCurrency } from '@/src/utils/costs';
import { getCateringSimulations } from '@/src/services/cateringSimulation.service';
import { fetchClients } from '@/src/services/clientService';

export default function CateringSimulationDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [clientName, setClientName] = useState<string>('—');
  const [sim, setSim] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSimulation() {
      if (!id) return;

      try {
        setLoading(true);
        const [sims, clients] = await Promise.all([
          getCateringSimulations(),
          fetchClients(),
        ]);

        const found = sims.find((s) => s.id === id);

        setSim(found || null);

        if (found?.clientId) {
          const client = clients.find((c) => c.id === found.clientId);
          setClientName(client?.name || 'Client inconnu');
        }
      } catch (e) {
        console.error('❌ load simulation error:', e);
        setSim(null);
      } finally {
        setLoading(false);
      }
    }

    loadSimulation();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  if (!sim) {
    return (
      <View style={styles.center}>
        <Text>Simulation introuvable</Text>
      </View>
    );
  }

  const prestations = [
    {
      key: 'breakfast',
      label: 'Petit-déjeuner',
      data: sim.breakfast,
    },
    {
      key: 'lunch',
      label: 'Déjeuner',
      data: sim.lunch,
    },
    {
      key: 'drinks',
      label: 'Boissons',
      data: sim.drinks,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{sim.name || 'Simulation sans nom'}</Text>

      <Text style={styles.subtitle}>
        Client : {clientName}
      </Text>

      <Text style={styles.subtitle}>
        Date livraison : {sim.dateLivraison || 'Non définie'}
      </Text>

      <Text style={styles.status}>Statut : {sim.status || '—'}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Résultats financiers</Text>

        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Chiffre d’affaires</Text>
          <Text style={styles.resultValue}>
            {formatCurrency(sim.globalTurnover ?? 0)}
          </Text>
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Coût total</Text>
          <Text style={styles.resultValue}>
            {formatCurrency(sim.globalCost ?? 0)}
          </Text>
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Marge globale</Text>
          <Text style={styles.resultValue}>
            {formatCurrency(sim.globalMargin ?? 0)}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prestations</Text>

        {prestations.map((item) => {
          if (!item.data?.enabled) return null;

          return (
            <View key={item.key} style={styles.cardLine}>
              <Text style={styles.lineTitle}>{item.label}</Text>

              <Text style={styles.lineText}>
                Personnes : {item.data.numberOfPeople ?? 0}
              </Text>

              <Text style={styles.lineText}>
                Jours : {item.data.numberOfDays ?? 0}
              </Text>

              <Text style={styles.lineText}>
                Prix unitaire : {formatCurrency(item.data.unitPrice ?? 0)}
              </Text>

              <Text style={styles.lineText}>
                Food cost : {item.data.foodCostRate ?? 0}%
              </Text>

              <Text style={styles.lineText}>
                Remise : {item.data.discount ?? 0}%
              </Text>
            </View>
          );
        })}
      </View>

      {sim.service?.enabled && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service</Text>

          <View style={styles.cardLine}>
            <Text style={styles.lineText}>
              Personnes : {sim.service.numberOfPeople ?? 0}
            </Text>

            <Text style={styles.lineText}>
              Jours : {sim.service.numberOfDays ?? 0}
            </Text>

            <Text style={styles.lineText}>
              Taux serveur : {formatCurrency(sim.service.serverRate ?? 0)}
            </Text>

            <Text style={styles.lineText}>
              Taux cuisinier : {formatCurrency(sim.service.cookRate ?? 0)}
            </Text>

            <Text style={styles.lineText}>
              Remise : {sim.service.discount ?? 0}%
            </Text>
          </View>
        </View>
      )}

      {sim.serviceCosts && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coûts de service journaliers</Text>

          <View style={styles.cardLine}>
            <Text style={styles.lineText}>
              Serveur : {formatCurrency(sim.serviceCosts.serverDailyCost ?? 0)}
            </Text>

            <Text style={styles.lineText}>
              Cuisinier : {formatCurrency(sim.serviceCosts.cookDailyCost ?? 0)}
            </Text>

            <Text style={styles.lineText}>
              Gaz : {formatCurrency(sim.serviceCosts.gasDailyCost ?? 0)}
            </Text>

            <Text style={styles.lineText}>
              Carburant : {formatCurrency(sim.serviceCosts.fuelDailyCost ?? 0)}
            </Text>

            <Text style={styles.lineText}>
              Électricité :{' '}
              {formatCurrency(sim.serviceCosts.electricityDailyCost ?? 0)}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.actions}>
        {/* 🔵 Créer proforma */}
        {sim?.id && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() =>
              router.push({
                pathname: '/proformas/create-from-simulation',
                params: { simulationId: sim.id },
              })
            }
          >
            <Text style={styles.secondaryButtonText}>
              Créer proforma
            </Text>
          </TouchableOpacity>
        )}

        {/* 🟢 Créer commande */}
        {sim?.id && (
          <TouchableOpacity
            style={styles.createOrderBtn}
            onPress={() =>
              router.push({
                pathname: '/orders/new',
                params: { fromSimulationId: sim.id },
              })
            }
          >
            <Text style={styles.createOrderText}>Créer commande</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() =>
            router.push({
              pathname: '/tools/calculator',
              params: {
                reuseSimulationId: sim.id,
              },
            })
          }
        >
          <Text style={styles.secondaryButtonText}>
            Réutiliser cette simulation
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/simulations')}
        >
          <Text style={styles.backButtonText}>Retour aux simulations</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
    padding: 16,
  },

  center: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
    color: '#111827',
  },

  subtitle: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },

  status: {
    fontSize: 13,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 16,
  },

  section: {
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
    color: '#111827',
  },

  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
  },

  resultLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },

  resultValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  cardLine: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
  },

  lineTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
    color: '#111827',
  },

  lineText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },

  actions: {
    marginTop: 10,
  },

  createOrderBtn: {
    backgroundColor: '#28a745',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },

  createOrderText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },

  secondaryButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },

  secondaryButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },

  backButton: {
    backgroundColor: '#E5E7EB',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  backButtonText: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 15,
  },
});