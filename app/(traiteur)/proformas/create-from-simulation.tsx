import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

import { getCateringSimulations } from '@/src/services/cateringSimulation.service';
import { createCateringProforma } from '@/src/services/cateringProforma.service';
import { fetchClients } from '@/src/services/clientService';
import { formatCurrency } from '@/src/utils/costs';

export default function CreateProformaFromSimulationScreen() {
  const params = useLocalSearchParams<{ simulationId?: string }>();
  const simulationId = Array.isArray(params.simulationId)
    ? params.simulationId[0]
    : params.simulationId;

  const [simulation, setSimulation] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const [sims, clients] = await Promise.all([
          getCateringSimulations(),
          fetchClients(),
        ]);

        const foundSimulation = sims.find((s) => s.id === simulationId);

        if (!foundSimulation) {
          setSimulation(null);
          return;
        }

        const foundClient = clients.find(
          (c: any) => c.id === foundSimulation.clientId
        );

        setSimulation(foundSimulation);
        setClient(foundClient || null);
      } catch (e) {
        console.error('❌ load simulation proforma error:', e);
        Alert.alert('Erreur', 'Impossible de charger la simulation');
      } finally {
        setLoading(false);
      }
    }

    if (simulationId) {
      load();
    } else {
      setLoading(false);
    }
  }, [simulationId]);

  const items = useMemo(() => {
    if (!simulation) return [];

    const result: any[] = [];

    const map = [
      { key: 'breakfast', label: 'Petit-déjeuner' },
      { key: 'lunch', label: 'Déjeuner' },
      { key: 'dinner', label: 'Dîner' },
      { key: 'drinks', label: 'Boissons' },
      { key: 'service', label: 'Service traiteur' },
    ];

    map.forEach(({ key, label }) => {
      const item = simulation[key];

      if (item?.enabled) {
        const numberOfPeople = Number(item.numberOfPeople || 0);
        const numberOfDays = Number(item.numberOfDays || 1);
        const unitPrice = Number(item.unitPrice || 0);

        let quantity = numberOfPeople * numberOfDays;

        if (key === 'service') {
          quantity = Number(item.quantity || 1);
        }

        const total = quantity * unitPrice;

        if (quantity > 0 && unitPrice > 0) {
          result.push({
            label,
            quantity,
            unitPrice,
            total,
          });
        }
      }
    });

    return result;
  }, [simulation]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.total || 0), 0);
  }, [items]);

  function getClientName() {
    return (
      client?.name ||
      client?.clientName ||
      simulation?.clientName ||
      'Client'
    );
  }

  function getClientRccm() {
  return client?.rccm || '';
}

function getClientIdnat() {
  return client?.idnat || '';
}

function getClientAddress() {
  return client?.address || simulation?.clientAddress || '';
}

function getClientCity() {
  return client?.city || simulation?.clientCity || '';
}

  function getEventDate() {
    return simulation?.dateLivraison || simulation?.eventDate || '';
  }

  function getValidityDate() {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  }

  async function handleCreate() {
    if (!simulation) return;

    if (items.length === 0) {
      Alert.alert(
        'Erreur',
        'Impossible de créer une proforma sans lignes commerciales.'
      );
      return;
    }

    try {
      setSaving(true);

      const proformaId = await createCateringProforma({
        simulationId: simulation.id,
        clientId: simulation.clientId,
        clientName: getClientName(),

        issueDate: new Date().toISOString().slice(0, 10),
        validityDate: getValidityDate(),
        eventDate: getEventDate(),

        status: 'draft',

        items,
        menu: simulation.menu || simulation.menus || [],

        totals: {
          subtotal,
          total: subtotal,
          currency: 'USD',
        },
      });

      Alert.alert('Succès', 'Proforma créée avec succès');

      router.replace({
        pathname: '/(traiteur)/proformas/[id]',
        params: { id: proformaId },
      });
    } catch (e: any) {
      console.error('❌ create proforma error:', e);
      Alert.alert(
        'Erreur',
        e?.message || 'Impossible de créer la proforma'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!simulation) {
    return (
      <View style={styles.center}>
        <Text>Simulation introuvable</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Créer une proforma</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Simulation</Text>
        <Text style={styles.line}>{simulation.name || 'Simulation sans nom'}</Text>
        <Text style={styles.line}>Client : {getClientName()}</Text>
        <Text style={styles.line}>Date événement : {getEventDate() || '—'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Lignes proforma</Text>

        {items.map((item, index) => (
          <View key={`${item.label}-${index}`} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemLabel}>{item.label}</Text>
              <Text style={styles.itemSub}>
                Qté : {item.quantity} × {formatCurrency(item.unitPrice)}
              </Text>
            </View>

            <Text style={styles.itemTotal}>
              {formatCurrency(item.total)}
            </Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total proforma</Text>
          <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, saving && styles.disabledButton]}
        onPress={handleCreate}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Créer la proforma</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push('/(traiteur)/simulations')}
      >
        <Text style={styles.backButtonText}>Retour aux simulations</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F4F6F8',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
    color: '#4B5563',
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 16,
    color: '#111827',
  },

  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    elevation: 2,
  },

  sectionTitle: {
    fontWeight: '800',
    marginBottom: 10,
    fontSize: 16,
    color: '#111827',
  },

  line: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 5,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 10,
  },

  itemLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  itemSub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 3,
  },

  itemTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginLeft: 10,
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },

  totalLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },

  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },

  button: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },

  disabledButton: {
    opacity: 0.7,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '800',
  },

  backButton: {
    backgroundColor: '#E5E7EB',
    padding: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },

  backButtonText: {
    color: '#111827',
    fontWeight: '800',
  },
});