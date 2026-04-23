import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import {
  CateringProforma,
  deleteCateringProforma,
  getCateringProformas,
} from '@/src/services/cateringProforma.service';
import { formatCurrency } from '@/src/utils/costs';

export default function ProformasScreen() {
  const [proformas, setProformas] = useState<CateringProforma[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProformas = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCateringProformas();
      setProformas(data);
    } catch (e) {
      console.error('❌ load proformas error:', e);
      Alert.alert('Erreur', 'Impossible de charger les proformas');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProformas();
    }, [loadProformas])
  );

  const handleDelete = async (id?: string) => {
    if (!id) return;

    Alert.alert(
      'Supprimer proforma',
      'Voulez-vous vraiment supprimer cette proforma ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCateringProforma(id);
              loadProformas();
            } catch (e) {
              console.error('❌ delete proforma error:', e);
              Alert.alert('Erreur', 'Impossible de supprimer la proforma');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Chargement des proformas...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Proformas</Text>

      {proformas.length === 0 ? (
        <Text style={styles.empty}>Aucune proforma créée</Text>
      ) : (
        proformas.map((p) => (
          <View key={p.id} style={styles.card}>
            <Text style={styles.cardTitle}>
              {p.number || 'Proforma sans numéro'}
            </Text>

            <Text style={styles.line}>
              Client : {p.clientName || p.clientId || '—'}
            </Text>

            <Text style={styles.line}>
              Date : {p.issueDate || '—'}
            </Text>

            <Text style={styles.line}>
              Statut : {p.status || 'draft'}
            </Text>

            <Text style={styles.amount}>
              Total : {formatCurrency(p.totals?.total ?? 0)}
            </Text>

            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/proformas/[id]',
                    params: { id: p.id },
                  })
                }
              >
                <Text style={styles.link}>Voir</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handleDelete(p.id)}>
                <Text style={[styles.link, styles.delete]}>
                  Supprimer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

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
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 16,
    color: '#111827',
  },

  empty: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 40,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
    color: '#111827',
  },

  line: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },

  amount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginTop: 6,
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },

  link: {
    color: '#007AFF',
    fontWeight: '700',
  },

  delete: {
    color: '#DC2626',
  },
});