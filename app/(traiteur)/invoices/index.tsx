import React, { useCallback, useMemo, useState } from 'react';
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
  CateringInvoice,
  getCateringInvoices,
} from '@/src/services/cateringInvoice.service';
import { formatCurrency } from '@/src/utils/costs';

export default function InvoicesScreen() {
  const [invoices, setInvoices] = useState<CateringInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getCateringInvoices();

      const sorted = [...data].sort((a: any, b: any) => {
        const aTime =
          a.createdAt?.toMillis?.() ||
          new Date(a.issueDate || '').getTime() ||
          0;

        const bTime =
          b.createdAt?.toMillis?.() ||
          new Date(b.issueDate || '').getTime() ||
          0;

        return bTime - aTime;
      });

      setInvoices(sorted);
    } catch (e) {
      console.error('❌ load invoices error:', e);
      Alert.alert('Erreur', 'Impossible de charger les factures');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInvoices();
    }, [loadInvoices])
  );

  const totalAmount = useMemo(() => {
    return invoices.reduce((sum, invoice) => {
      return sum + (invoice.totals?.total ?? 0);
    }, 0);
  }, [invoices]);

  function formatDate(date?: string) {
    if (!date) return '—';

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) return date;

    return d.toLocaleDateString('fr-FR');
  }

  function getStatusLabel(status?: string) {
    switch (status) {
      case 'issued':
        return 'Émise';
      case 'paid':
        return 'Payée';
      case 'cancelled':
        return 'Annulée';
      default:
        return status || 'Émise';
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Chargement des factures...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Factures</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Nombre de factures</Text>
        <Text style={styles.summaryValue}>{invoices.length}</Text>

        <Text style={styles.summaryLabel}>Chiffre d’affaires facturé</Text>
        <Text style={styles.summaryAmount}>
          {formatCurrency(totalAmount)}
        </Text>
      </View>

      {invoices.length === 0 ? (
        <Text style={styles.empty}>Aucune facture créée</Text>
      ) : (
        invoices.map((invoice: any) => (
          <View key={invoice.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>
                  {invoice.number || 'Facture sans numéro'}
                </Text>

                <Text style={styles.client}>
                  {invoice.clientName || 'Client non défini'}
                </Text>
              </View>

              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {getStatusLabel(invoice.status)}
                </Text>
              </View>
            </View>

            <Text style={styles.line}>
              Date facture : {formatDate(invoice.issueDate)}
            </Text>

            {invoice.orderNumber ? (
              <Text style={styles.line}>Commande : {invoice.orderNumber}</Text>
            ) : null}

            {invoice.proformaNumber ? (
              <Text style={styles.line}>Proforma : {invoice.proformaNumber}</Text>
            ) : null}

            <Text style={styles.amount}>
              Total : {formatCurrency(invoice.totals?.total ?? 0)}
            </Text>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.primaryAction}
                onPress={() => {
                  if (!invoice.id) return;

                  router.push({
                    pathname: '/(traiteur)/invoices/[id]',
                    params: { id: invoice.id },
                  });
                }}
              >
                <Text style={styles.primaryActionText}>Voir</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push('/(traiteur)/orders')}
      >
        <Text style={styles.backButtonText}>Retour aux commandes</Text>
      </TouchableOpacity>

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
  loadingText: {
    marginTop: 10,
    color: '#4B5563',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 16,
    color: '#111827',
  },
  summaryCard: {
    backgroundColor: '#065F46',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  summaryLabel: {
    color: '#D1FAE5',
    fontSize: 13,
    marginBottom: 2,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
  },
  summaryAmount: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },
  empty: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 40,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  client: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 3,
  },
  statusBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    color: '#065F46',
    fontSize: 11,
    fontWeight: '700',
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
    marginTop: 14,
  },
  primaryAction: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryActionText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  backButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  backButtonText: {
    color: '#111827',
    fontWeight: '800',
    fontSize: 14,
  },
});