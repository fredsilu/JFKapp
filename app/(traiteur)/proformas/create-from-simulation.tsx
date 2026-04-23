import React, { useEffect, useState } from 'react';
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

export default function CreateProformaFromSimulationScreen() {
  const { simulationId } = useLocalSearchParams<{ simulationId: string }>();

  const [simulation, setSimulation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const sims = await getCateringSimulations();
        const found = sims.find((s) => s.id === simulationId);
        setSimulation(found || null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    if (simulationId) load();
  }, [simulationId]);

  const buildItemsFromSimulation = () => {
    if (!simulation) return [];

    const items: any[] = [];

    const map = [
      { key: 'breakfast', label: 'Petit-déjeuner' },
      { key: 'lunch', label: 'Déjeuner' },
      { key: 'drinks', label: 'Boissons' },
    ];

    map.forEach(({ key, label }) => {
      const item = simulation[key];

      if (item?.enabled) {
        const qty = item.numberOfPeople * item.numberOfDays;
        const total = qty * item.unitPrice;

        items.push({
          label,
          quantity: qty,
          unitPrice: item.unitPrice,
          total,
        });
      }
    });

    return items;
  };

  const handleCreate = async () => {
    if (!simulation) return;

    try {
      setSaving(true);

      const items = buildItemsFromSimulation();

      const proformaId = await createCateringProforma({
        simulationId: simulation.id,
        clientId: simulation.clientId,
        clientName: simulation.clientName || 'Client',
        issueDate: new Date().toISOString().slice(0, 10),
        status: 'draft',
        items,
        menu: [],
        totals: {
          subtotal: simulation.globalTurnover ?? 0,
          total: simulation.globalTurnover ?? 0,
          currency: 'USD',
        },
      });

      Alert.alert('Succès', 'Proforma créée');

      router.replace(`/proformas/${proformaId}`);
    } catch (e) {
      console.error(e);
      Alert.alert('Erreur', 'Impossible de créer la proforma');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Chargement...</Text>
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

      <Text style={styles.subtitle}>
        {simulation.name}
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Résumé</Text>

        <Text>Chiffre d’affaires : {simulation.globalTurnover}</Text>
        <Text>Coût : {simulation.globalCost}</Text>
        <Text>Marge : {simulation.globalMargin}</Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleCreate}
        disabled={saving}
      >
        <Text style={styles.buttonText}>
          {saving ? 'Création...' : 'Créer la proforma'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F4F6F8' },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 20,
  },

  section: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },

  sectionTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },

  button: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: '800',
  },
});