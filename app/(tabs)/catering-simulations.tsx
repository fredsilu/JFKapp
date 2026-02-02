import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import { getCateringSimulations } from '../../src/services/cateringSimulations';
import { CateringSimulation } from '@/types/catering';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import ErrorMessage from '@/src/components/ErrorMessage';
import { formatCurrency } from '@/src/utils/costs';

export default function CateringSimulationsScreen() {
  const [simulations, setSimulations] = useState<CateringSimulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSimulations() {
      try {
        const data = await getCateringSimulations();
        setSimulations(data);
      } catch (err) {
        setError('Erreur lors du chargement des simulations');
      } finally {
        setLoading(false);
      }
    }

    loadSimulations();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Simulations traiteur</Text>

      {simulations.map(sim => (
        <View key={sim.id} style={styles.card}>
          <Text style={styles.name}>{sim.name}</Text>
          <Text style={styles.client}>Client : {sim.clientName}</Text>

          <View style={styles.row}>
            <Text style={styles.amount}>
              CA : ${formatCurrency(sim.results.totals.totalRevenue)}
            </Text>
            <Text style={styles.amount}>
              Bénéfice : ${formatCurrency(sim.results.totals.totalProfit)}
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity>
              <Text style={styles.link}>Voir</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={styles.link}>Réutiliser</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={[styles.link, styles.delete]}>
                Supprimer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
