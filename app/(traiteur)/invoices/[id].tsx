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
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import {
  CateringInvoice,
  getCateringInvoiceById,
} from '@/src/services/cateringInvoice.service';
import { formatCurrency } from '@/src/utils/costs';

export default function InvoiceDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [invoice, setInvoice] = useState<CateringInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  const loadInvoice = useCallback(async () => {
    if (!id) {
      Alert.alert('Erreur', 'Identifiant facture introuvable');
      router.back();
      return;
    }

    try {
      setLoading(true);
      const data = await getCateringInvoiceById(id);

      if (!data) {
        Alert.alert('Erreur', 'Facture introuvable');
        router.back();
        return;
      }

      setInvoice(data);
    } catch (e) {
      console.error('❌ load invoice detail error:', e);
      Alert.alert('Erreur', 'Impossible de charger la facture');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadInvoice();
    }, [loadInvoice])
  );

  function formatDate(date?: string) {
    if (!date) return '—';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return date;
    return d.toLocaleDateString('fr-FR');
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Chargement de la facture...</Text>
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={styles.center}>
        <Text>Facture introuvable</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Détail facture</Text>

      <View style={styles.headerCard}>
        <Text style={styles.number}>{invoice.number}</Text>

        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Facturée</Text>
        </View>

        <Text style={styles.client}>
          {invoice.clientName || 'Client non défini'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Informations client</Text>
        <Text style={styles.line}>RCCM : {invoice.clientRccm || '—'}</Text>
        <Text style={styles.line}>IDNAT : {invoice.clientIdnat || '—'}</Text>
        <Text style={styles.line}>Adresse : {invoice.clientAddress || '—'}</Text>
        <Text style={styles.line}>Ville : {invoice.clientCity || '—'}</Text>
        <Text style={styles.line}>Date facture : {formatDate(invoice.issueDate)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Lignes facture</Text>

        {invoice.items?.length ? (
          invoice.items.map((item, index) => (
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
          ))
        ) : (
          <Text style={styles.empty}>Aucune ligne</Text>
        )}
      </View>

      <View style={styles.totalCard}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Sous-total</Text>
          <Text style={styles.totalValue}>
            {formatCurrency(invoice.totals?.subtotal ?? 0)}
          </Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.grandTotalLabel}>Total facture</Text>
          <Text style={styles.grandTotalValue}>
            {formatCurrency(invoice.totals?.total ?? 0)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.pdfButton}
        onPress={() => {
          Alert.alert('PDF facture', 'Le PDF facture sera ajouté à l’étape suivante.');
        }}
      >
        <Text style={styles.pdfButtonText}>Générer PDF facture</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push('/(traiteur)/invoices/index')}
      >
        <Text style={styles.backButtonText}>Retour aux factures</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8', padding: 16 },
  center: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 16 },
  loadingText: { marginTop: 10, color: '#4B5563' },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 16 },
  headerCard: { backgroundColor: '#065F46', borderRadius: 14, padding: 16, marginBottom: 14 },
  number: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 8 },
  client: { color: '#D1FAE5', fontSize: 15, marginTop: 8 },
  statusBadge: { alignSelf: 'flex-start', backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  statusText: { color: '#065F46', fontSize: 12, fontWeight: '800' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 14, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 10 },
  line: { fontSize: 14, color: '#4B5563', marginBottom: 5 },
  empty: { color: '#6B7280', fontSize: 14 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingVertical: 10 },
  itemLabel: { fontSize: 14, fontWeight: '700', color: '#111827' },
  itemSub: { fontSize: 13, color: '#6B7280', marginTop: 3 },
  itemTotal: { fontSize: 14, fontWeight: '800', color: '#111827', marginLeft: 10 },
  totalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 14, elevation: 2 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalLabel: { fontSize: 14, color: '#4B5563' },
  totalValue: { fontSize: 14, fontWeight: '700', color: '#111827' },
  grandTotalLabel: { fontSize: 16, fontWeight: '900', color: '#111827' },
  grandTotalValue: { fontSize: 16, fontWeight: '900', color: '#111827' },
  pdfButton: { backgroundColor: '#286aa7', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  pdfButtonText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  backButton: { backgroundColor: '#E5E7EB', paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  backButtonText: { color: '#111827', fontWeight: '800', fontSize: 14 },
});