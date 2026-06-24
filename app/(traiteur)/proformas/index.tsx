// app/(traiteur)/proformas/index.tsx

import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { router, useFocusEffect, Stack } from 'expo-router';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import * as Linking from "expo-linking";
import { generateProformaPDFFile } from "@/src/services/invoicePdf.service";

import { formatShortDocumentDate } from '@/src/utils/dateFormat';
import {
  CateringProforma,
  getCateringProformas,
  cancelCateringProforma,
} from '@/src/services/cateringProforma.service';
import { formatCurrency } from '@/src/utils/costs';

type ProformaView = 'active' | 'converted' | 'all';

type ProformaStatus =
  | 'draft'
  | 'sent'
  | 'approved'
  | 'rejected'
  | 'converted'
  | 'invoiced'
  | 'cancelled'
  | 'expired';

const ACTIVE_STATUSES: ProformaStatus[] = ['draft', 'sent', 'approved'];

export default function ProformasScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [proformas, setProformas] = useState<CateringProforma[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ProformaView>('active');
  const [search, setSearch] = useState('');

  const loadProformas = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getCateringProformas();
      const visibleData = data.filter((p) => p.isDeleted !== true);

      const sortedData = [...visibleData].sort((a, b) => {
        const dateA =
          a.createdAt?.toMillis?.() ||
          new Date(a.issueDate || '').getTime() ||
          0;

        const dateB =
          b.createdAt?.toMillis?.() ||
          new Date(b.issueDate || '').getTime() ||
          0;

        return dateB - dateA;
      });

      setProformas(sortedData);
    } catch (e) {
      console.error('❌ load proformas error:', e);
      Alert.alert('Erreur', 'Impossible de charger les proformas');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace('/(traiteur)/sales');
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => subscription.remove();
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      loadProformas();
    }, [loadProformas])
  );

  function displayDate(value: any): string {
    if (!value) return '—';

    if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      return value;
    }

    return formatShortDocumentDate(value);
  }

  function normalizeStatus(status?: string): ProformaStatus {
    if (
      status === 'draft' ||
      status === 'sent' ||
      status === 'approved' ||
      status === 'rejected' ||
      status === 'converted' ||
      status === 'invoiced' ||
      status === 'cancelled' ||
      status === 'expired'
    ) {
      return status;
    }

    return 'draft';
  }

  function isInvoicedProforma(p: CateringProforma) {
    return normalizeStatus(p.status) === 'invoiced' || p.isInvoiced === true;
  }

  function isConvertedProforma(p: CateringProforma) {
    const status = normalizeStatus(p.status);

    return (
      status === 'converted' ||
      status === 'invoiced' ||
      p.isInvoiced === true ||
      Boolean(p.orderId) ||
      Boolean(p.invoiceId)
    );
  }

  const activeProformas = useMemo(() => {
    return proformas.filter((p) => {
      const status = normalizeStatus(p.status);
      return ACTIVE_STATUSES.includes(status) && !isConvertedProforma(p);
    });
  }, [proformas]);

  const approvedProformas = useMemo(() => {
    return proformas.filter((p) => {
      const status = normalizeStatus(p.status);
      return status === 'approved' && !isConvertedProforma(p);
    });
  }, [proformas]);

  const convertedProformas = useMemo(() => {
    return proformas.filter((p) => isConvertedProforma(p));
  }, [proformas]);

  const invoicedProformas = useMemo(() => {
    return proformas.filter((p) => isInvoicedProforma(p));
  }, [proformas]);

  const displayedProformas = useMemo(() => {
    const base =
      view === 'active'
        ? activeProformas
        : view === 'converted'
          ? convertedProformas
          : proformas;

    const q = search.trim().toLowerCase();

    if (!q) return base;

    return base.filter((p) => {
      return [
        p.number,
        p.clientName,
        p.clientId,
        p.eventName,
        p.orderNumber,
        p.invoiceNumber,
        p.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [view, activeProformas, convertedProformas, proformas, search]);

  const activeTotal = useMemo(() => {
    return activeProformas.reduce(
      (sum, p) => sum + Number(p.totals?.total || 0),
      0
    );
  }, [activeProformas]);

  const approvedTotal = useMemo(() => {
    return approvedProformas.reduce(
      (sum, p) => sum + Number(p.totals?.total || 0),
      0
    );
  }, [approvedProformas]);

  const convertedTotal = useMemo(() => {
    return convertedProformas.reduce(
      (sum, p) => sum + Number(p.totals?.total || 0),
      0
    );
  }, [convertedProformas]);

  const invoicedTotal = useMemo(() => {
    return invoicedProformas.reduce(
      (sum, p) => sum + Number(p.totals?.total || 0),
      0
    );
  }, [invoicedProformas]);

  function getClientLabel(p: CateringProforma) {
    return p.clientName || p.clientId || 'Client non défini';
  }

  function getStatusLabel(p: CateringProforma) {
    const status = normalizeStatus(p.status);

    if (isInvoicedProforma(p)) return 'Facturée';

    switch (status) {
      case 'draft':
        return 'Brouillon';
      case 'sent':
        return 'Envoyée';
      case 'cancelled':
        return 'Annulée';
      case 'approved':
        return 'Acceptée';
      case 'rejected':
        return 'Rejetée';
      case 'converted':
        return 'Convertie';
      case 'invoiced':
        return 'Facturée';
      case 'expired':
        return 'Expirée';
      default:
        return 'Brouillon';
    }
  }

  function getStatusColors(p: CateringProforma) {
    const status = normalizeStatus(p.status);

    if (isInvoicedProforma(p)) {
      return { backgroundColor: '#DBEAFE', color: '#1E40AF' };
    }

    if (status === 'cancelled' || status === 'rejected' || status === 'expired') {
      return { backgroundColor: '#FEE2E2', color: '#991B1B' };
    }

    if (status === 'converted' || Boolean(p.orderId)) {
      return { backgroundColor: '#DCFCE7', color: '#166534' };
    }

    if (status === 'approved') {
      return { backgroundColor: '#FEF3C7', color: '#92400E' };
    }

    return { backgroundColor: '#E8F0FE', color: '#1A73E8' };
  }

  function canCancelProforma(p: CateringProforma) {
    const status = normalizeStatus(p.status);

    return (
      p.id &&
      !isConvertedProforma(p) &&
      status !== 'cancelled' &&
      status !== 'invoiced'
    );
  }

  async function handleCancelProforma(p: CateringProforma) {
    if (!p.id) return;

    const message = `Voulez-vous vraiment annuler la proforma ${p.number || ''} ?`;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(message);
      if (!confirmed) return;

      try {
        await cancelCateringProforma(p.id);
        window.alert('Proforma annulée.');
        await loadProformas();
      } catch (e: any) {
        console.error('❌ cancel proforma error:', e);
        window.alert(e?.message || 'Impossible d’annuler la proforma.');
      }

      return;
    }

    Alert.alert('Annuler proforma', message, [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui, annuler',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelCateringProforma(p.id!);
            Alert.alert('Succès', 'Proforma annulée.');
            await loadProformas();
          } catch (e: any) {
            Alert.alert(
              'Erreur',
              e?.message || 'Impossible d’annuler la proforma.'
            );
          }
        },
      },
    ]);
  }

  function openProforma(id?: string) {
    if (!id) return;

    router.push({
      pathname: '/(traiteur)/proformas/[id]',
      params: { id },
    });
  }

  async function openPdf(proforma: CateringProforma) {
    try {
      if ((proforma as any).source === "legacy_import") {
        if (!(proforma as any).pdfUrl) {
          Alert.alert("PDF indisponible", "Aucun PDF archivé trouvé.");
          return;
        }

        await Linking.openURL((proforma as any).pdfUrl);
        return;
      }

      const pdfFile = await generateProformaPDFFile(proforma);
      await Linking.openURL(pdfFile.uri);
    } catch (error) {
      console.error("❌ PDF proforma:", error);
      Alert.alert("Erreur", "Impossible de générer le PDF.");
    }
  }

  function renderStatusBadge(p: CateringProforma) {
    const colors = getStatusColors(p);

    return (
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: colors.backgroundColor },
        ]}
      >
        <Text style={[styles.statusText, { color: colors.color }]}>
          {getStatusLabel(p)}
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Chargement des proformas...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          isDesktop && styles.desktopContent,
        ]}
      >
        <TouchableOpacity
          onPress={() => router.replace('/(traiteur)/sales')}
          style={styles.backPill}
          activeOpacity={0.75}
        >
          <Icon name="arrow-back" size={18} color="#0F4C81" />
          <Text style={styles.backPillText}>Retour aux ventes</Text>
        </TouchableOpacity>

        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Proformas</Text>
            <Text style={styles.subtitle}>
              Suivez les proformas en cours, converties et facturées.
            </Text>
          </View>
        </View>

        {isDesktop ? (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Icon name="pending-actions" size={24} color="#007AFF" />
              <View>
                <Text style={styles.statLabel}>En cours</Text>
                <Text style={styles.statValue}>{activeProformas.length}</Text>
                <Text style={styles.statAmount}>{formatCurrency(activeTotal)}</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <Icon name="check-circle" size={24} color="#92400E" />
              <View>
                <Text style={styles.statLabel}>Acceptées</Text>
                <Text style={styles.statValue}>{approvedProformas.length}</Text>
                <Text style={styles.statAmount}>{formatCurrency(approvedTotal)}</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <Icon name="swap-horiz" size={24} color="#065F46" />
              <View>
                <Text style={styles.statLabel}>Converties</Text>
                <Text style={styles.statValue}>{convertedProformas.length}</Text>
                <Text style={styles.statAmount}>{formatCurrency(convertedTotal)}</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <Icon name="receipt-long" size={24} color="#1E3A8A" />
              <View>
                <Text style={styles.statLabel}>Facturées</Text>
                <Text style={styles.statValue}>{invoicedProformas.length}</Text>
                <Text style={styles.statAmount}>{formatCurrency(invoicedTotal)}</Text>
              </View>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Proformas en cours</Text>
              <Text style={styles.summaryValue}>{activeProformas.length}</Text>
              <Text style={styles.summaryLabel}>Total en cours</Text>
              <Text style={styles.summaryAmount}>{formatCurrency(activeTotal)}</Text>
            </View>

            <View style={[styles.summaryCard, styles.approvedSummaryCard]}>
              <Text style={styles.summaryLabel}>
                Proformas acceptées non converties
              </Text>
              <Text style={styles.summaryValue}>{approvedProformas.length}</Text>
              <Text style={styles.summaryLabel}>Total accepté</Text>
              <Text style={styles.summaryAmount}>{formatCurrency(approvedTotal)}</Text>
            </View>

            <View style={[styles.summaryCard, styles.convertedSummaryCard]}>
              <Text style={styles.summaryLabel}>Proformas converties</Text>
              <Text style={styles.summaryValue}>{convertedProformas.length}</Text>
              <Text style={styles.summaryLabel}>Total converti</Text>
              <Text style={styles.summaryAmount}>{formatCurrency(convertedTotal)}</Text>
            </View>

            <View style={[styles.summaryCard, styles.invoicedSummaryCard]}>
              <Text style={styles.summaryLabel}>Proformas facturées</Text>
              <Text style={styles.summaryValue}>{invoicedProformas.length}</Text>
              <Text style={styles.summaryLabel}>Total facturé</Text>
              <Text style={styles.summaryAmount}>{formatCurrency(invoicedTotal)}</Text>
            </View>
          </>
        )}

        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par client, numéro, statut..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, view === 'active' && styles.activeTab]}
            onPress={() => setView('active')}
          >
            <Text
              style={[
                styles.tabText,
                view === 'active' && styles.activeTabText,
              ]}
            >
              En cours
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, view === 'converted' && styles.activeTab]}
            onPress={() => setView('converted')}
          >
            <Text
              style={[
                styles.tabText,
                view === 'converted' && styles.activeTabText,
              ]}
            >
              Converties
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, view === 'all' && styles.activeTab]}
            onPress={() => setView('all')}
          >
            <Text
              style={[
                styles.tabText,
                view === 'all' && styles.activeTabText,
              ]}
            >
              Toutes
            </Text>
          </TouchableOpacity>
        </View>

        {displayedProformas.length === 0 ? (
          <Text style={styles.empty}>Aucune proforma dans cette vue</Text>
        ) : isDesktop ? (
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, styles.colNumber]}>N° Proforma</Text>
                <Text style={[styles.th, styles.colClient]}>Client</Text>
                <Text style={[styles.th, styles.colDate]}>Date</Text>
                <Text style={[styles.th, styles.colEvent]}>Événement</Text>
                <Text style={[styles.th, styles.colAmount]}>Montant</Text>
                <Text style={[styles.th, styles.colStatus]}>Statut</Text>
                <Text style={[styles.th, styles.colDate]}>Commande</Text>
                <Text style={[styles.th, styles.colDate]}>Facture</Text>
                <Text style={[styles.th, styles.colActions]}>Actions</Text>
              </View>

              {displayedProformas.map((p) => (
                <View key={p.id || p.number} style={styles.tableRow}>
                  <Text style={[styles.td, styles.colNumber]} numberOfLines={1}>
                    {p.number || '—'}
                  </Text>

                  <Text style={[styles.td, styles.colClient]} numberOfLines={1}>
                    {getClientLabel(p)}
                  </Text>

                  <Text style={[styles.td, styles.colDate]}>
                    {formatShortDocumentDate(p.issueDate)}
                  </Text>

                  <Text style={[styles.td, styles.colEvent]} numberOfLines={1}>
                    {p.eventName || '—'}
                  </Text>

                  <Text style={[styles.td, styles.colAmount]}>
                    {formatCurrency(Number(p.totals?.total || 0))}
                  </Text>

                  <View style={styles.colStatus}>{renderStatusBadge(p)}</View>

                  <Text style={[styles.td, styles.colDate]} numberOfLines={1}>
                    {p.orderNumber || '—'}
                  </Text>

                  <Text style={[styles.td, styles.colDate]} numberOfLines={1}>
                    {p.invoiceNumber || '—'}
                  </Text>

                  <View style={[styles.rowActions, styles.colActions]}>
                    <TouchableOpacity
                      style={styles.smallActionButton}
                      onPress={() => openProforma(p.id)}
                    >
                      <Icon name="visibility" size={16} color="#007AFF" />
                      <Text style={styles.smallActionText}>Voir</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.pdfActionButton}
                      onPress={() => openPdf(p)}
                    >
                      <Icon name="picture-as-pdf" size={16} color="#059669" />
                      <Text style={styles.pdfActionText}>PDF</Text>
                    </TouchableOpacity>

                    {canCancelProforma(p) ? (
                      <TouchableOpacity
                        style={styles.deleteActionButtonLarge}
                        onPress={() => handleCancelProforma(p)}
                      >
                        <Icon name="close" size={16} color="#DC2626" />
                        <Text style={styles.deleteActionText}>Annuler</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.readOnlyBadge}>
                        <Icon name="lock-outline" size={14} color="#6B7280" />
                        <Text style={styles.readOnlyText}>Lecture seule</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          displayedProformas.map((p) => (
            <View key={p.id || p.number} style={styles.card}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => openProforma(p.id)}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>
                      {p.number || 'Proforma sans numéro'}
                    </Text>

                    <Text style={styles.client}>{getClientLabel(p)}</Text>
                  </View>

                  {renderStatusBadge(p)}
                </View>

                <Text style={styles.line}>
                  Date : {formatShortDocumentDate(p.issueDate)}
                </Text>

                {(p.eventDate || (p as any).dateEvenement) ? (
                  <Text style={styles.line}>
                    Événement :{' '}
                    {displayDate(p.eventDate || (p as any).dateEvenement)}
                  </Text>
                ) : null}

                {p.orderNumber ? (
                  <Text style={styles.line}>Commande : {p.orderNumber}</Text>
                ) : null}

                {p.invoiceNumber ? (
                  <Text style={styles.line}>Facture : {p.invoiceNumber}</Text>
                ) : null}

                <Text style={styles.amount}>
                  Total : {formatCurrency(Number(p.totals?.total || 0))}
                </Text>
              </TouchableOpacity>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.primaryAction}
                  onPress={() => openProforma(p.id)}
                >
                  <Text style={styles.primaryActionText}>Voir</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pdfMobileAction}
                  onPress={() => openPdf(p)}
                >
                  <Text style={styles.pdfMobileActionText}>PDF</Text>
                </TouchableOpacity>

                {canCancelProforma(p) ? (
                  <TouchableOpacity
                    style={styles.cancelAction}
                    onPress={() => handleCancelProforma(p)}
                  >
                    <Text style={styles.cancelActionText}>Annuler</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.mobileReadOnlyBadge}>
                    <Icon name="lock-outline" size={14} color="#6B7280" />
                    <Text style={styles.readOnlyText}>Lecture seule</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
    padding: 16,
  },

  content: {
    paddingBottom: 30,
  },

  desktopContent: {
    width: '100%',
    maxWidth: 1500,
    alignSelf: 'center',
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

  backPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 20,
  },

  backPillText: {
    color: '#0F4C81',
    fontSize: 14,
    fontWeight: '700',
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 16,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
  },

  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },

  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },

  statCard: {
    flex: 1,
    minHeight: 96,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },

  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },

  statAmount: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '700',
    marginTop: 2,
  },

  summaryCard: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },

  approvedSummaryCard: {
    backgroundColor: '#92400E',
  },

  convertedSummaryCard: {
    backgroundColor: '#065F46',
  },

  invoicedSummaryCard: {
    backgroundColor: '#1E3A8A',
  },

  summaryLabel: {
    color: '#D1D5DB',
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

  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    marginBottom: 14,
  },

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
    gap: 4,
  },

  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },

  activeTab: {
    backgroundColor: '#111827',
  },

  tabText: {
    color: '#374151',
    fontWeight: '800',
    fontSize: 13,
  },

  activeTabText: {
    color: '#fff',
  },

  empty: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 40,
  },

  table: {
    minWidth: 1450,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  tableHeader: {
    flexDirection: 'row',
    minHeight: 44,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  tableRow: {
    flexDirection: 'row',
    minHeight: 66,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  th: {
    fontSize: 13,
    fontWeight: '800',
    color: '#374151',
    paddingHorizontal: 12,
  },

  td: {
    fontSize: 13,
    color: '#111827',
    paddingHorizontal: 12,
  },

  colNumber: {
    width: 150,
  },

  colClient: {
    width: 180,
  },

  colDate: {
    width: 130,
  },

  colEvent: {
    width: 230,
  },

  colAmount: {
    width: 140,
    textAlign: 'right',
  },

  colStatus: {
    width: 130,
    justifyContent: 'center',
  },

  colActions: {
    width: 420,
  },

  rowActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },

  smallActionButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  smallActionText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '700',
  },

  deleteActionButtonLarge: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  deleteActionText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
  },

  readOnlyBadge: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  mobileReadOnlyBadge: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },

  readOnlyText: {
    color: '#6B7280',
    fontWeight: '700',
    fontSize: 12,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },

  statusText: {
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
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

  cancelAction: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },

  cancelActionText: {
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 13,
  }, pdfActionButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    backgroundColor: "#ECFDF5",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  pdfActionText: {
    color: "#059669",
    fontSize: 13,
    fontWeight: "700",
  },
  pdfMobileAction: {
    flex: 1,
    backgroundColor: "#ECFDF5",
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },

  pdfMobileActionText: {
    color: "#059669",
    fontWeight: "800",
    fontSize: 13,
  },
});