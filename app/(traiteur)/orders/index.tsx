//app/(traiteur)/orders/index.tsx
import React, { useCallback, useMemo, useState } from 'react';
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
import { router, useFocusEffect } from 'expo-router';
import {
  getOrders,
  updateOrderStatus,
} from '@/src/services/cateringOrderService';

import { CateringOrder } from '@/types/catering';
import { formatCurrency } from '@/src/utils/costs';
import { MaterialIcons as Icon } from '@expo/vector-icons';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<CateringOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getOrders();

      const sorted = [...data].sort((a: any, b: any) => {
        const aTime =
          a.createdAt?.toMillis?.() ||
          new Date(a.dateLivraison || '').getTime() ||
          0;

        const bTime =
          b.createdAt?.toMillis?.() ||
          new Date(b.dateLivraison || '').getTime() ||
          0;

        return bTime - aTime;
      });

      setOrders(sorted);
    } catch (e) {
      console.error('❌ load orders error:', e);
      Alert.alert('Erreur', 'Impossible de charger les commandes');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders();

      return () => {
        setOrders([]);
      };
    }, [loadOrders])
  );

  const totalOrders = orders.length;

  const completedOrders = useMemo(() => {
    return orders.filter((o: any) => o.status === 'Livré').length;
  }, [orders]);

  function getOrderAmount(order: any) {
    return (
      order.billedAmount ??
      order.totals?.subtotal ??
      order.totals?.total ??
      order.pricingReference?.totalHT ??
      0
    );
  }

  const totalAmount = useMemo(() => {
    return orders.reduce((sum: number, o: any) => {
      return sum + getOrderAmount(o);
    }, 0);
  }, [orders]);

  function formatDate(date?: string) {
    if (!date) return '—';

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) return date;

    return d.toLocaleDateString('fr-FR');
  }

  function getStatusLabel(status?: string) {
    switch (status) {
      case 'En cours':
        return 'En cours';
      case 'En préparation':
        return 'En préparation';
      case 'Livré':
        return 'Livré';
      case 'Annulé':
        return 'Annulé';
      default:
        return status || 'En cours';
    }
  }

  function getStatusStyle(status?: string) {
    switch (status) {
      case 'En cours':
        return {
          backgroundColor: '#DBEAFE',
          color: '#1D4ED8',
        };
      case 'En préparation':
        return {
          backgroundColor: '#FEF3C7',
          color: '#92400E',
        };
      case 'Livré':
        return {
          backgroundColor: '#DCFCE7',
          color: '#166534',
        };
      case 'Annulé':
        return {
          backgroundColor: '#FEE2E2',
          color: '#991B1B',
        };
      default:
        return {
          backgroundColor: '#E5E7EB',
          color: '#374151',
        };
    }
  }
  function getInvoiceBadge(order: CateringOrder) {
    if (order.invoiceId) {
      return {
        label: 'Facturée',
        backgroundColor: '#DCFCE7',
        color: '#166534',
      };
    }

    return {
      label: 'Non facturée',
      backgroundColor: '#FEF3C7',
      color: '#92400E',
    };
  }

  async function handleChangeStatus(
    orderId?: string,
    status?: CateringOrder['status']
  ) {
    if (!orderId || !status) return;

    try {
      await updateOrderStatus(orderId, status);

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
              ...order,
              status,
            }
            : order
        )
      );

      await loadOrders();
    } catch (e) {
      console.error('❌ update order status error:', e);
      Alert.alert('Erreur', 'Impossible de modifier le statut');
    }
  }

  function confirmStatusChange(
    orderId?: string,
    status?: CateringOrder['status']
  ) {
    if (!orderId || !status) return;

    const message = `Confirmer le changement vers "${getStatusLabel(status)}" ?`;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(message);

      if (confirmed) {
        handleChangeStatus(orderId, status);
      }

      return;
    }

    Alert.alert(
      'Modifier statut',
      message,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => handleChangeStatus(orderId, status),
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Chargement des commandes...</Text>
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


      <Text style={styles.title}>Commandes</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Commandes créées</Text>
        <Text style={styles.summaryValue}>{totalOrders}</Text>

        <Text style={styles.summaryLabel}>Valeur totale</Text>
        <Text style={styles.summaryAmount}>{formatCurrency(totalAmount)}</Text>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: '#065F46' }]}>
        <Text style={styles.summaryLabel}>Commandes terminées</Text>
        <Text style={styles.summaryAmount}>{completedOrders}</Text>
      </View>

      {orders.length === 0 ? (
        <Text style={styles.empty}>Aucune commande créée</Text>
      ) : (
        orders.map((order: any) => {
          const statusStyle = getStatusStyle(order.status);
          const invoiceBadge = getInvoiceBadge(order);

          return (
            <View key={order.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>
                    {order.number || 'Commande sans numéro'}
                  </Text>

                  <Text style={styles.client}>
                    {order.client?.name || order.clientName || order.clientId || 'Client non défini'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusStyle.backgroundColor },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: statusStyle.color },
                    ]}
                  >
                    {getStatusLabel(order.status)}
                  </Text>
                </View>
              </View>

              {order.proformaNumber ? (
                <Text style={styles.line}>Proforma : {order.proformaNumber}</Text>
              ) : null}

              <Text style={styles.line}>
                Date événement : {formatDate(order.dateLivraison)}
              </Text>

              {order.deliveryTime ? (
                <Text style={styles.line}>Heure : {order.deliveryTime}</Text>
              ) : null}

              {order.deliveryAddress ? (
                <Text style={styles.line}>Adresse : {order.deliveryAddress}</Text>
              ) : null}

              {order.guestCount ? (
                <Text style={styles.line}>Invités : {order.guestCount}</Text>
              ) : null}

              <View style={styles.amountRow}>
                <Text style={styles.amount}>
                  Total : {formatCurrency(getOrderAmount(order))}
                </Text>

                <View
                  style={[
                    styles.invoiceBadge,
                    {
                      backgroundColor: invoiceBadge.backgroundColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.invoiceBadgeText,
                      {
                        color: invoiceBadge.color,
                      },
                    ]}
                  >
                    {invoiceBadge.label}
                  </Text>
                </View>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.primaryAction}
                  onPress={() => {
                    if (!order.id) return;

                    router.push({
                      pathname: '/(traiteur)/orders/[id]',
                      params: { id: order.id },
                    });
                  }}
                >
                  <Text style={styles.primaryActionText}>Voir</Text>
                </TouchableOpacity>

                {order.status === 'En cours' && (
                  <TouchableOpacity
                    style={styles.secondaryAction}
                    onPress={() =>
                      confirmStatusChange(
                        order.id,
                        'En préparation' as CateringOrder['status']
                      )
                    }
                  >
                    <Text style={styles.secondaryActionText}>Préparer</Text>
                  </TouchableOpacity>
                )}

                {order.status === 'En préparation' && (
                  <TouchableOpacity
                    style={styles.successAction}
                    onPress={() =>
                      confirmStatusChange(
                        order.id,
                        'Livré' as CateringOrder['status']
                      )
                    }
                  >
                    <Text style={styles.successActionText}>Terminer</Text>
                  </TouchableOpacity>
                )}

                {order.status !== 'Livré' && order.status !== 'Annulé' && (
                  <TouchableOpacity
                    style={styles.deleteAction}
                    onPress={() =>
                      confirmStatusChange(
                        order.id,
                        'Annulé' as CateringOrder['status']
                      )
                    }
                  >
                    <Text style={styles.deleteActionText}>Annuler</Text>
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
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

  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 8,
    flexWrap: 'wrap',
  },
  primaryAction: {
    flex: 1,
    minWidth: 90,
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
    minWidth: 90,
    backgroundColor: '#FEF3C7',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryActionText: {
    color: '#92400E',
    fontWeight: '800',
    fontSize: 13,
  },
  successAction: {
    flex: 1,
    minWidth: 90,
    backgroundColor: '#DCFCE7',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  successActionText: {
    color: '#166534',
    fontWeight: '800',
    fontSize: 13,
  },
  deleteAction: {
    flex: 1,
    minWidth: 90,
    backgroundColor: '#FEE2E2',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteActionText: {
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 13,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  backIcon: {
    fontSize: 24,
    marginRight: 10,
    color: '#111827',
  },

  backText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
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

  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 10,
  },

  invoiceBadge: {
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 999,

    alignItems: 'center',
    justifyContent: 'center',
  },

  invoiceBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 14,
    textAlignVertical: 'center',
  },
});