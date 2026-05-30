//app/(traiteur)/proformas/[id].tsx
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Asset } from 'expo-asset';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';

import { downloadHtmlAsPdfWeb } from '@/src/utils/downloadHtmlAsPdfWeb';
import { createOrderFromProforma } from '@/src/services/cateringOrderService';
import { buildProformaHTML } from '@/src/utils/proformaHtml';
import {
  generateDocumentPDF,
  shareDocumentPDF,
} from '@/src/services/generateDocumentPDF';
import { formatCurrency } from '@/src/utils/costs';
import {
  CateringProforma,
  ProformaStatus,
  getCateringProformaById,
  updateCateringProforma,
  markProformaAsConvertedToOrder,
} from '@/src/services/cateringProforma.service';

export default function ProformaDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [proforma, setProforma] = useState<CateringProforma | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  const loadProforma = useCallback(async () => {
    if (!id) {
      Alert.alert('Erreur', 'Identifiant proforma introuvable');
      router.replace('/(traiteur)/proformas');
      return;
    }

    try {
      setLoading(true);
      const data = await getCateringProformaById(id);

      if (!data) {
        Alert.alert('Erreur', 'Proforma introuvable');
        router.replace('/(traiteur)/proformas'); s
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

  const handleCreateOrder = async () => {
    try {
      if (!proforma?.id) {
        Alert.alert('Erreur', 'Proforma invalide');
        return;
      }

      if (proforma.orderId || proforma.status === 'converted') {
        Alert.alert('Information', 'Cette proforma a déjà été convertie en commande.');
        return;
      }

      setLoading(true);

      const order = await createOrderFromProforma(proforma);

      if (!order?.id) {
        Alert.alert('Erreur', 'Création commande échouée');
        return;
      }

      await markProformaAsConvertedToOrder(
        proforma.id,
        order.id,
        order.number ?? ''
      );

      Alert.alert('Succès', 'Commande créée avec succès');
      router.replace({
        pathname: '/(traiteur)/orders/[id]',
        params: { id: order.id },
      });
    } catch (e) {
      console.error('❌ create order error:', e);
      Alert.alert('Erreur', 'Impossible de créer la commande');
    } finally {
      setLoading(false);
    }
  };

  async function getImageSource(moduleId: number): Promise<string> {
    const asset = Asset.fromModule(moduleId);
    await asset.downloadAsync();

    const uri = asset.localUri || asset.uri;

    if (Platform.OS === 'web') {
      return uri;
    }

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });

    return `data:image/png;base64,${base64}`;
  }

  async function handleGeneratePDF() {
    if (!proforma) return;
    const printWindow =
      Platform.OS === 'web'
        ? window.open('', '_blank')
        : null;

    try {
      setPdfLoading(true);

      const logoBase64 = await getImageSource(
        require('@/assets/images/crepolia-logo.png')
      );

      let stampBase64 = '';
      let signatureBase64 = '';

      try {
        stampBase64 = await getImageSource(
          require('@/assets/images/crepolia-stamp.png')
        );
      } catch { }

      try {
        signatureBase64 = await getImageSource(
          require('@/assets/images/crepolia-signature.png')
        );
      } catch { }

      const html = buildProformaHTML(proforma, {
        logoBase64,
        stampBase64,
        signatureBase64,
      });

      const filename = `PROFORMA_${proforma.number}.pdf`;

      if (Platform.OS === 'web') {
        downloadHtmlAsPdfWeb(
          html,
          filename,
          printWindow
        );
        return;
      }

      const uri = await generateDocumentPDF(html, filename);
      await shareDocumentPDF(uri, 'Partager la proforma');
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

  async function handleChangeStatus(status: ProformaStatus) {
    if (!proforma?.id) return;

    try {
      await updateCateringProforma(proforma.id, { status });
      await loadProforma();
    } catch (e) {
      console.error('❌ update status error:', e);
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
    }
  }

  function handleSend() {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Confirmer l’envoi au client ?'
      );

      if (confirmed) {
        handleChangeStatus('sent');
      }

      return;
    }

    Alert.alert('Envoyer proforma', 'Confirmer l’envoi au client ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Envoyer', onPress: () => handleChangeStatus('sent') },
    ]);
  }

  function handleApprove() {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Le client a accepté ?'
      );

      if (confirmed) {
        handleChangeStatus('approved');
      }

      return;
    }

    Alert.alert('Valider proforma', 'Le client a accepté ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Oui', onPress: () => handleChangeStatus('approved') },
    ]);
  }

  function handleReject() {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Confirmer le rejet ?'
      );

      if (confirmed) {
        handleChangeStatus('rejected');
      }

      return;
    }

    Alert.alert('Rejeter proforma', 'Confirmer le rejet ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Rejeter',
        style: 'destructive',
        onPress: () => handleChangeStatus('rejected'),
      },
    ]);
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
        return 'Acceptée';
      case 'converted':
        return 'Convertie en commande';
      case 'invoiced':
        return 'Facturée';
      case 'rejected':
        return 'Rejetée';
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

  const isConverted = proforma.status === 'converted' || !!proforma.orderId;

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
        <Text style={styles.line}>Date émission : {formatDate(proforma.issueDate)}</Text>
        <Text style={styles.line}>Validité : {formatDate(proforma.validityDate)}</Text>
        <Text style={styles.line}>Date événement : {formatDate(proforma.eventDate)}</Text>

        {proforma.orderNumber ? (
          <Text style={styles.line}>Commande : {proforma.orderNumber}</Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Lignes proforma</Text>

        {proforma.items?.length ? (
          proforma.items.map((item, index) => (
            <View key={`${item.label}-${index}`} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemLabel}>{item.label}</Text>
                <Text style={styles.itemSub}>
                  Jrs : {item.numberOfDays || 1} ×
                  Qté : {item.quantity} ×
                  {formatCurrency(item.unitPrice)}
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

        {Number(proforma.totals?.discount || 0) > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Remise globale</Text>

            <Text
              style={[
                styles.totalValue,
                { color: '#DC2626', fontWeight: '800' },
              ]}
            >
              - {formatCurrency(Number(proforma.totals?.discount || 0))}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.totalRow,
            {
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
              paddingTop: 10,
              marginTop: 6,
            },
          ]}
        >
          <Text style={styles.grandTotalLabel}>Total proforma</Text>

          <Text style={styles.grandTotalValue}>
            {formatCurrency(proforma.totals?.total ?? 0)}
          </Text>
        </View>
      </View>

      {proforma.status === 'approved' && !isConverted && (
        <TouchableOpacity
          style={styles.convertButton}
          onPress={() => {
            if (Platform.OS === 'web') {
              const confirmed = window.confirm(
                'Confirmer la création de la commande ?'
              );

              if (confirmed) {
                handleCreateOrder();
              }

              return;
            }

            Alert.alert(
              'Créer commande',
              'Confirmer la création de la commande ?',
              [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Créer', onPress: handleCreateOrder },
              ]
            );
          }}
          disabled={loading}
        >
          <Text style={styles.convertButtonText}>Créer commande</Text>
        </TouchableOpacity>
      )}

      {isConverted && (
        <Text style={styles.convertedText}>
          ✅ Convertie en commande ({proforma.orderNumber || 'commande créée'})
        </Text>
      )}

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

      {proforma.status === 'draft' && (
        <TouchableOpacity style={styles.primaryButton} onPress={handleSend}>
          <Text style={styles.primaryButtonText}>Envoyer au client</Text>
        </TouchableOpacity>
      )}

      {proforma.status === 'sent' && (
        <View style={styles.rowActions}>
          <TouchableOpacity style={styles.successButton} onPress={handleApprove}>
            <Text style={styles.buttonText}>Acceptée</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dangerButton} onPress={handleReject}>
            <Text style={styles.buttonText}>Rejetée</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.replace('/(traiteur)/proformas')}
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
    backgroundColor: '#286aa7',
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
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  successButton: {
    flex: 1,
    backgroundColor: '#28A745',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  dangerButton: {
    flex: 1,
    backgroundColor: '#DC3545',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
  },
  convertButton: {
    backgroundColor: '#6F42C1',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  convertButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
  },
  convertedText: {
    color: '#16A34A',
    marginTop: 10,
    marginBottom: 14,
    fontWeight: '700',
  },

});