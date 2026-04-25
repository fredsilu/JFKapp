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
import { Asset } from 'expo-asset';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import {
  CateringProforma,
  getCateringProformaById,
} from '@/src/services/cateringProforma.service';

import { buildProformaHTML } from '@/src/utils/proformaHtml';
import {
  generateDocumentPDF,
  shareDocumentPDF,
} from '@/src/services/generateDocumentPDF';
import { formatCurrency } from '@/src/utils/costs';

export default function ProformaDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [proforma, setProforma] = useState<CateringProforma | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  const loadProforma = useCallback(async () => {
    if (!id) {
      Alert.alert('Erreur', 'Identifiant proforma introuvable');
      router.back();
      return;
    }

    try {
      setLoading(true);

      const data = await getCateringProformaById(id);

      if (!data) {
        Alert.alert('Erreur', 'Proforma introuvable');
        router.back();
        return;
      }

      setProforma(data);
    } catch (e) {
      console.error('❌ load proforma detail error:', e);
      Alert.alert('Erreur', 'Impossible de charger la proforma');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadProforma();
    }, [loadProforma])
  );

  async function getImageBase64(moduleId: number): Promise<string> {
    const asset = Asset.fromModule(moduleId);
    await asset.downloadAsync();

    const uri = asset.localUri || asset.uri;

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64'
    });

    return `data:image/png;base64,${base64}`;
  }

  async function handleGeneratePDF() {
    if (!proforma) return;

    try {
      setPdfLoading(true);

      // 🔥 Convert images en base64 (OBLIGATOIRE pour expo-print)
      const logoBase64 = await getImageBase64(
        require('@/assets/images/crepolia-logo.png')
      );

      let stampBase64 = '';
      let signatureBase64 = '';

      try {
        stampBase64 = await getImageBase64(
          require('@/assets/images/crepolia-stamp.png')
        );
      } catch { }

      try {
        signatureBase64 = await getImageBase64(
          require('@/assets/images/crepolia-signature.png')
        );
      } catch { }

      // 🔥 HTML CORRECT
      const html = buildProformaHTML(proforma, {
        logoBase64,
        stampBase64,
        signatureBase64,
      });

      const uri = await generateDocumentPDF(html);

      await shareDocumentPDF(uri);

    } catch (e: any) {
      console.error('❌ generate proforma pdf error:', e);
      Alert.alert(
        'Erreur PDF',
        e?.message || 'Impossible de générer la proforma PDF'
      );
    } finally {
      setPdfLoading(false);
    }
  }

  function formatDate(date?: string) {
    if (!date) return '—';

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
      return date;
    }

    return d.toLocaleDateString('fr-FR');
  }

  function getStatusLabel(status?: string) {
    switch (status) {
      case 'draft':
        return 'Brouillon';
      case 'sent':
        return 'Envoyée';
      case 'approved':
        return 'Approuvée';
      case 'rejected':
        return 'Rejetée';
      case 'expired':
        return 'Expirée';
      case 'converted':
        return 'Convertie en commande';
      default:
        return status || 'Brouillon';
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Chargement de la proforma...</Text>
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
      <Text style={styles.title}>Détail proforma</Text>

      <View style={styles.headerCard}>
        <Text style={styles.number}>
          {proforma.number || 'Proforma sans numéro'}
        </Text>

        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {getStatusLabel(proforma.status)}
          </Text>
        </View>

        <Text style={styles.client}>
          {proforma.clientName || proforma.clientId || 'Client non défini'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Informations</Text>

        <Text style={styles.line}>
          Date émission : {formatDate(proforma.issueDate)}
        </Text>

        <Text style={styles.line}>
          Validité : {formatDate(proforma.validityDate)}
        </Text>

        <Text style={styles.line}>
          Date événement : {formatDate(proforma.eventDate)}
        </Text>

        <Text style={styles.line}>
          Simulation liée : {proforma.simulationId || '—'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Lignes proforma</Text>

        {proforma.items?.length ? (
          proforma.items.map((item, index) => (
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
            {formatCurrency(proforma.totals?.subtotal ?? 0)}
          </Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.grandTotalLabel}>Total proforma</Text>
          <Text style={styles.grandTotalValue}>
            {formatCurrency(proforma.totals?.total ?? 0)}
          </Text>
        </View>
      </View>

      {proforma.menu?.length ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Menu proposé</Text>

          {proforma.menu.map((menuItem, index) => (
            <View key={`${menuItem.name}-${index}`} style={styles.menuItem}>
              <Text style={styles.menuName}>{menuItem.name}</Text>

              {menuItem.category ? (
                <Text style={styles.menuMeta}>{menuItem.category}</Text>
              ) : null}

              {menuItem.notes ? (
                <Text style={styles.menuNotes}>{menuItem.notes}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.pdfButton, pdfLoading && styles.disabledButton]}
        onPress={handleGeneratePDF}
        disabled={pdfLoading}
      >
        {pdfLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.pdfButtonText}>Générer PDF client</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push('/(traiteur)/proformas')}
      >
        <Text style={styles.backButtonText}>Retour à la liste</Text>
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
    color: '#111827',
    marginBottom: 16,
  },

  headerCard: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },

  number: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
  },

  client: {
    color: '#D1D5DB',
    fontSize: 15,
    marginTop: 8,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F0FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  statusText: {
    color: '#1A73E8',
    fontSize: 12,
    fontWeight: '800',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },

  line: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 5,
  },

  empty: {
    color: '#6B7280',
    fontSize: 14,
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

  totalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    elevation: 2,
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  totalLabel: {
    fontSize: 14,
    color: '#4B5563',
  },

  totalValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },

  grandTotalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },

  menuItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 9,
  },

  menuName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  menuMeta: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 2,
  },

  menuNotes: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  pdfButton: {
    backgroundColor: '#28A745',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },

  pdfButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
  },

  disabledButton: {
    opacity: 0.7,
  },

  backButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },

  backButtonText: {
    color: '#111827',
    fontWeight: '800',
    fontSize: 14,
  },
});