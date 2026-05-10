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
import { MaterialIcons as Icon } from '@expo/vector-icons';

import {
  CateringProforma,
  deleteCateringProforma,
  getCateringProformas,
} from '@/src/services/cateringProforma.service';
import { formatCurrency } from '@/src/utils/costs';

type ProformaView = 'active' | 'converted' | 'all';

type ProformaStatus =
  | 'draft'
  | 'sent'
  | 'approved'
  | 'rejected'
  | 'converted'
  | 'expired';

const ACTIVE_STATUSES: ProformaStatus[] = ['draft', 'sent', 'approved'];

export default function ProformasScreen() {
  const [proformas, setProformas] = useState<CateringProforma[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ProformaView>('active');

  const loadProformas = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getCateringProformas();

      const visibleData = data.filter((p) => p.isDeleted !== true);

      const sortedData = [...visibleData].sort((a, b) => {
        const dateA = a.issueDate || '';
        const dateB = b.issueDate || '';
        return dateB.localeCompare(dateA);
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
      loadProformas();
    }, [loadProformas])
  );

  function normalizeStatus(status?: string): ProformaStatus {
    if (
      status === 'draft' ||
      status === 'sent' ||
      status === 'approved' ||
      status === 'rejected' ||
      status === 'converted' ||
      status === 'expired'
    ) {
      return status;
    }

    return 'draft';
  }

  function isConvertedProforma(p: CateringProforma) {
    const status = normalizeStatus(p.status);
    return status === 'converted' || p.isInvoiced === true;
  }

  const activeProformas = useMemo(() => {
    return proformas.filter((p) => {
      const status = normalizeStatus(p.status);
      return ACTIVE_STATUSES.includes(status) && !isConvertedProforma(p);
    });
  }, [proformas]);

  const convertedProformas = useMemo(() => {
    return proformas.filter((p) => isConvertedProforma(p));
  }, [proformas]);

  const displayedProformas = useMemo(() => {
    if (view === 'active') return activeProformas;
    if (view === 'converted') return convertedProformas;
    return proformas;
  }, [view, activeProformas, convertedProformas, proformas]);

  const activeTotal = useMemo(() => {
    return activeProformas.reduce((sum, p) => sum + (p.totals?.total ?? 0), 0);
  }, [activeProformas]);

  const approvedTotal = useMemo(() => {
    return proformas
      .filter((p) => normalizeStatus(p.status) === 'approved')
      .filter((p) => !isConvertedProforma(p))
      .reduce((sum, p) => sum + (p.totals?.total ?? 0), 0);
  }, [proformas]);

  const convertedTotal = useMemo(() => {
    return convertedProformas.reduce((sum, p) => sum + (p.totals?.total ?? 0), 0);
  }, [convertedProformas]);

  function formatDate(date?: string) {
    if (!date) return '—';

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
      return date;
    }

    return d.toLocaleDateString('fr-FR');
  }

  function getStatusLabel(status?: string, isInvoiced?: boolean) {
    if (isInvoiced) return 'Convertie';

    switch (normalizeStatus(status)) {
      case 'draft':
        return 'Brouillon';
      case 'sent':
        return 'Envoyée';
      case 'approved':
        return 'Acceptée';
      case 'rejected':
        return 'Rejetée';
      case 'converted':
        return 'Convertie';
      case 'expired':
        return 'Expirée';
      default:
        return 'Brouillon';
    }
  }

  function getStatusStyle(p: CateringProforma) {
    const status = normalizeStatus(p.status);

    if (isConvertedProforma(p)) {
      return {
        badge: styles.convertedBadge,
        text: styles.convertedBadgeText,
      };
    }

    if (status === 'approved') {
      return {
        badge: styles.approvedBadge,
        text: styles.approvedBadgeText,
      };
    }

    if (status === 'rejected' || status === 'expired') {
      return {
        badge: styles.closedBadge,
        text: styles.closedBadgeText,
      };
    }

    return {
      badge: styles.statusBadge,
      text: styles.statusText,
    };
  }

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
              await loadProformas();
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
        <Text style={styles.loadingText}>Chargement des proformas...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity
        onPress={() => router.replace('/(traiteur)/sales')}
        style={styles.backPill}
        activeOpacity={0.75}
      >
        <Icon name="arrow-back" size={18} color="#0F4C81" />
        <Text style={styles.backPillText}>Ventes</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Proformas</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Proformas en cours</Text>
        <Text style={styles.summaryValue}>{activeProformas.length}</Text>

        <Text style={styles.summaryLabel}>Total en cours</Text>
        <Text style={styles.summaryAmount}>{formatCurrency(activeTotal)}</Text>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: '#92400E' }]}>
        <Text style={styles.summaryLabel}>Proformas acceptées non converties</Text>
        <Text style={styles.summaryAmount}>{formatCurrency(approvedTotal)}</Text>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: '#065F46' }]}>
        <Text style={styles.summaryLabel}>Proformas converties</Text>
        <Text style={styles.summaryAmount}>{formatCurrency(convertedTotal)}</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, view === 'active' && styles.activeTab]}
          onPress={() => setView('active')}
        >
          <Text style={[styles.tabText, view === 'active' && styles.activeTabText]}>
            En cours
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, view === 'converted' && styles.activeTab]}
          onPress={() => setView('converted')}
        >
          <Text style={[styles.tabText, view === 'converted' && styles.activeTabText]}>
            Converties
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, view === 'all' && styles.activeTab]}
          onPress={() => setView('all')}
        >
          <Text style={[styles.tabText, view === 'all' && styles.activeTabText]}>
            Toutes
          </Text>
        </TouchableOpacity>
      </View>

      {displayedProformas.length === 0 ? (
        <Text style={styles.empty}>Aucune proforma dans cette vue</Text>
      ) : (
        displayedProformas.map((p) => {
          const statusStyle = getStatusStyle(p);

          return (
            <View key={p.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>
                    {p.number || 'Proforma sans numéro'}
                  </Text>

                  <Text style={styles.client}>
                    {p.clientName || p.clientId || 'Client non défini'}
                  </Text>
                </View>

                <View style={[styles.statusBadge, statusStyle.badge]}>
                  <Text style={[styles.statusText, statusStyle.text]}>
                    {getStatusLabel(p.status, p.isInvoiced)}
                  </Text>
                </View>
              </View>

              <Text style={styles.line}>Date : {formatDate(p.issueDate)}</Text>

              {p.eventDate ? (
                <Text style={styles.line}>
                  Événement : {formatDate(p.eventDate)}
                </Text>
              ) : null}

              {p.invoiceNumber ? (
                <Text style={styles.line}>Facture : {p.invoiceNumber}</Text>
              ) : null}

              <Text style={styles.amount}>
                Total : {formatCurrency(p.totals?.total ?? 0)}
              </Text>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.primaryAction}
                  onPress={() => {
                    if (!p.id) return;

                    router.push({
                      pathname: '/(traiteur)/proformas/[id]',
                      params: { id: p.id },
                    });
                  }}
                >
                  <Text style={styles.primaryActionText}>Voir</Text>
                </TouchableOpacity>

                {!isConvertedProforma(p) && (
                  <TouchableOpacity
                    style={styles.secondaryAction}
                    onPress={() => {
                      if (!p.id) return;

                      router.push({
                        pathname: '/(traiteur)/proformas/[id]',
                        params: { id: p.id },
                      });
                    }}
                  >
                    <Text style={styles.secondaryActionText}>Modifier</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })
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
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
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
    backgroundColor: '#E8F0FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },

  statusText: {
    color: '#1A73E8',
    fontSize: 11,
    fontWeight: '700',
  },

  approvedBadge: {
    backgroundColor: '#FEF3C7',
  },

  approvedBadgeText: {
    color: '#92400E',
  },

  convertedBadge: {
    backgroundColor: '#DCFCE7',
  },

  convertedBadgeText: {
    color: '#166534',
  },

  closedBadge: {
    backgroundColor: '#FEE2E2',
  },

  closedBadgeText: {
    color: '#991B1B',
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

  secondaryAction: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },

  secondaryActionText: {
    color: '#111827',
    fontWeight: '800',
    fontSize: 13,
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
    marginBottom: 12,
  },

  backPillText: {
    color: '#0F4C81',
    fontSize: 14,
    fontWeight: '700',
  },
});