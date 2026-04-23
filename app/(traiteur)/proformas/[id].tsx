import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

import { getCateringProformas } from '@/src/services/cateringProforma.service';
import { formatCurrency } from '@/src/utils/costs';

export default function ProformaDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [proforma, setProforma] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const list = await getCateringProformas();
        const found = list.find((p) => p.id === id);
        setProforma(found || null);
      } catch (e) {
        console.error('❌ load proforma error:', e);
      } finally {
        setLoading(false);
      }
    }

    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Chargement...</Text>
      </View>
    );
  }

  if (!proforma) {
    return (
      <View style={styles.center}>
        <Text>Proforma introuvable</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {proforma.number || 'Proforma'}
      </Text>

      <Text style={styles.subtitle}>
        Client : {proforma.clientName || '—'}
      </Text>

      <Text style={styles.subtitle}>
        Date : {proforma.issueDate || '—'}
      </Text>

      <Text style={styles.status}>
        Statut : {proforma.status}
      </Text>

      {/* 🔹 Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Détails</Text>

        {proforma.items?.map((item: any, i: number) => (
          <View key={i} style={styles.itemRow}>
            <View>
              <Text style={styles.itemLabel}>{item.label}</Text>
              <Text style={styles.itemSub}>
                {item.quantity} × {formatCurrency(item.unitPrice)}
              </Text>
            </View>

            <Text style={styles.itemTotal}>
              {formatCurrency(item.total)}
            </Text>
          </View>
        ))}
      </View>

      {/* 🔹 Totaux */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Total</Text>

        <Text style={styles.total}>
          {formatCurrency(proforma.totals?.total ?? 0)}
        </Text>
      </View>

      {/* 🔹 Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() =>
            router.push({
              pathname: '/orders/new',
              params: { fromProformaId: proforma.id },
            })
          }
        >
          <Text style={styles.primaryText}>
            Convertir en commande
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push('/proformas')}
        >
          <Text style={styles.secondaryText}>
            Retour
          </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },

  status: {
    marginBottom: 16,
    fontWeight: '700',
    color: '#007AFF',
  },

  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },

  sectionTitle: {
    fontWeight: '800',
    marginBottom: 10,
  },

  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  itemLabel: {
    fontWeight: '700',
  },

  itemSub: {
    fontSize: 12,
    color: '#666',
  },

  itemTotal: {
    fontWeight: '800',
  },

  total: {
    fontSize: 20,
    fontWeight: '900',
  },

  actions: {
    marginTop: 10,
  },

  primaryBtn: {
    backgroundColor: '#28a745',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },

  primaryText: {
    color: '#fff',
    fontWeight: '800',
  },

  secondaryBtn: {
    backgroundColor: '#E5E7EB',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  secondaryText: {
    fontWeight: '700',
    color: '#333',
  },
});