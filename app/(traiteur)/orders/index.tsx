// app/(traiteur)/orders/index.tsx
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { MaterialIcons as Icon } from '@expo/vector-icons';

import {
  getOrders,
  updateOrderStatus,
} from '@/src/services/cateringOrderService';

import { CateringOrder } from '@/types/catering';
import { formatCurrency } from '@/src/utils/costs';
import { formatShortDocumentDate } from '@/src/utils/dateFormat';

type OrderStatus = CateringOrder['status'];

type KanbanColumn = {
  key: OrderStatus;
  title: string;
  icon: keyof typeof Icon.glyphMap;
};

const KANBAN_COLUMNS: KanbanColumn[] = [
  { key: 'confirmed', title: 'Confirmées', icon: 'event-available' },
  { key: 'in-production', title: 'Préparation', icon: 'restaurant' },
  { key: 'delivered', title: 'Livrées', icon: 'check-circle' },
  { key: 'cancelled', title: 'Annulées', icon: 'cancel' },
];

export default function OrdersScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [orders, setOrders] = useState<CateringOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<'all' | CateringOrder['status']>('all');

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

  function getOrderAmount(order: any) {
    return (
      order.billedAmount ??
      order.totals?.subtotal ??
      order.totals?.total ??
      order.pricingReference?.totalHT ??
      0
    );
  }

  const completedOrders = useMemo(() => {
    return orders.filter((order: any) => order.status === 'delivered').length;
  }, [orders]);

  const productionOrders = useMemo(() => {
    return orders.filter((order: any) => order.status === 'in-production').length;
  }, [orders]);

  const confirmedOrders = useMemo(() => {
    return orders.filter((order: any) => order.status === 'confirmed').length;
  }, [orders]);

  const totalAmount = useMemo(() => {
    return orders.reduce((sum: number, order: any) => {
      return sum + getOrderAmount(order);
    }, 0);
  }, [orders]);

  function getStatusLabel(status?: string) {
    switch (status) {
      case 'draft':
        return 'Brouillon';
      case 'sent':
        return 'Envoyée';
      case 'confirmed':
        return 'Confirmée';
      case 'in-production':
        return 'En préparation';
      case 'delivered':
        return 'Livrée';
      case 'cancelled':
        return 'Annulée';
      default:
        return 'Confirmée';
    }
  }

  function getStatusStyle(status?: string) {
    switch (status) {
      case 'confirmed':
        return {
          backgroundColor: '#DBEAFE',
          color: '#1D4ED8',
        };

      case 'in-production':
        return {
          backgroundColor: '#FEF3C7',
          color: '#92400E',
        };

      case 'delivered':
        return {
          backgroundColor: '#DCFCE7',
          color: '#166534',
        };

      case 'cancelled':
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

    Alert.alert('Modifier statut', message, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        onPress: () => handleChangeStatus(orderId, status),
      },
    ]);
  }

  const displayedOrders = useMemo(() => {
    const q = search.trim().toLowerCase();

    return orders.filter((order: any) => {
      const matchesStatus =
        statusFilter === 'all' || order.status === statusFilter;

      const searchable = [
        order.number,
        order.client?.name,
        order.clientName,
        order.clientId,
        (order as any).proformaNumber,
        order.dateLivraison,
        order.deliveryAddress,
        order.status,
        order.designation,
        order.eventName,
        order.comment,
        order.guestCount,
        order.deliveryTime,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !q || searchable.includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  const kanbanOrders = useMemo(() => {
    return KANBAN_COLUMNS.reduce<Record<OrderStatus, CateringOrder[]>>(
      (acc, column) => {
        acc[column.key] = displayedOrders.filter(
          (order: any) => order.status === column.key
        );
        return acc;
      },
      {} as Record<OrderStatus, CateringOrder[]>
    );
  }, [displayedOrders]);

  function openOrder(orderId?: string) {
    if (!orderId) return;

    router.push({
      pathname: '/(traiteur)/orders/[id]',
      params: { id: orderId },
    });
  }

  function renderOrderCard(order: CateringOrder) {
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
              {order.client?.name ||
                (order as any).clientName ||
                order.clientId ||
                'Client non défini'}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusStyle.backgroundColor },
            ]}
          >
            <Text style={[styles.statusText, { color: statusStyle.color }]}>
              {getStatusLabel(order.status)}
            </Text>
          </View>
        </View>

        {(order as any).proformaNumber ? (
          <Text style={styles.line}>
            Proforma : {(order as any).proformaNumber}
          </Text>
        ) : null}

        <Text style={styles.line}>
          Créée le : {formatShortDocumentDate(order.createdAt)}
        </Text>

        <Text style={styles.line}>
          Date événement :{' '}
          {formatShortDocumentDate(
            (order as any).eventDate ||
            (order as any).dateEvenement ||
            order.dateLivraison
          )}
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
            onPress={() => openOrder(order.id)}
          >
            <Text style={styles.primaryActionText}>Voir</Text>
          </TouchableOpacity>

          {order.status === 'confirmed' ? (
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() =>
                confirmStatusChange(order.id, 'in-production')
              }
            >
              <Text style={styles.secondaryActionText}>Préparer</Text>
            </TouchableOpacity>
          ) : null}

          {order.status === 'in-production' ? (
            <TouchableOpacity
              style={styles.successAction}
              onPress={() => confirmStatusChange(order.id, 'delivered')}
            >
              <Text style={styles.successActionText}>Terminer</Text>
            </TouchableOpacity>
          ) : null}

          {order.status !== 'delivered' && order.status !== 'cancelled' ? (
            <TouchableOpacity
              style={styles.deleteAction}
              onPress={() => confirmStatusChange(order.id, 'cancelled')}
            >
              <Text style={styles.deleteActionText}>Annuler</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  }

  function renderKanbanCard(order: CateringOrder) {
    const invoiceBadge = getInvoiceBadge(order);

    return (
      <View key={order.id} style={styles.kanbanCard}>
        <View style={styles.kanbanCardHeader}>
          <Text style={styles.kanbanTitle} numberOfLines={1}>
            {order.number || 'Commande sans numéro'}
          </Text>

          <View
            style={[
              styles.invoiceBadge,
              { backgroundColor: invoiceBadge.backgroundColor },
            ]}
          >
            <Text
              style={[
                styles.invoiceBadgeText,
                { color: invoiceBadge.color },
              ]}
            >
              {invoiceBadge.label}
            </Text>
          </View>
        </View>

        <Text style={styles.kanbanClient} numberOfLines={1}>
          {order.client?.name ||
            (order as any).clientName ||
            order.clientId ||
            'Client non défini'}
        </Text>

        <View style={styles.kanbanInfoGrid}>
          <View style={styles.kanbanInfoItem}>
            <Icon name="event" size={15} color="#6B7280" />
            <Text style={styles.kanbanInfoText}>
              {formatShortDocumentDate(
                (order as any).eventDate ||
                (order as any).dateEvenement ||
                order.dateLivraison
              )}
            </Text>
          </View>

          {order.deliveryTime ? (
            <View style={styles.kanbanInfoItem}>
              <Icon name="schedule" size={15} color="#6B7280" />
              <Text style={styles.kanbanInfoText}>{order.deliveryTime}</Text>
            </View>
          ) : null}

          {order.guestCount ? (
            <View style={styles.kanbanInfoItem}>
              <Icon name="groups" size={15} color="#6B7280" />
              <Text style={styles.kanbanInfoText}>
                {order.guestCount} pers.
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.kanbanAmount}>
          {formatCurrency(getOrderAmount(order))}
        </Text>

        <View style={styles.kanbanActions}>
          <TouchableOpacity
            style={styles.kanbanPrimaryButton}
            onPress={() => openOrder(order.id)}
          >
            <Icon name="visibility" size={15} color="#007AFF" />
            <Text style={styles.kanbanPrimaryText}>Voir</Text>
          </TouchableOpacity>

          {order.status === 'confirmed' ? (
            <TouchableOpacity
              style={styles.kanbanSecondaryButton}
              onPress={() =>
                confirmStatusChange(order.id, 'in-production')
              }
            >
              <Text style={styles.kanbanSecondaryText}>Préparer</Text>
            </TouchableOpacity>
          ) : null}

          {order.status === 'in-production' ? (
            <TouchableOpacity
              style={styles.kanbanSuccessButton}
              onPress={() => confirmStatusChange(order.id, 'delivered')}
            >
              <Text style={styles.kanbanSuccessText}>Terminer</Text>
            </TouchableOpacity>
          ) : null}

          {order.status !== 'delivered' && order.status !== 'cancelled' ? (
            <TouchableOpacity
              style={styles.kanbanDeleteButton}
              onPress={() => confirmStatusChange(order.id, 'cancelled')}
            >
              <Icon name="close" size={15} color="#DC2626" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  }

  const filterItems: { label: string; value: 'all' | CateringOrder['status'] }[] =
    [
      { label: 'Toutes', value: 'all' },
      { label: 'Confirmées', value: 'confirmed' },
      { label: 'Préparation', value: 'in-production' },
      { label: 'Livrées', value: 'delivered' },
      { label: 'Annulées', value: 'cancelled' },
    ];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Chargement des commandes...</Text>
      </View>
    );
  }

  return (
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
          <Text style={styles.title}>Commandes</Text>
          <Text style={styles.subtitle}>
            Suivez les commandes confirmées, en préparation et livrées.
          </Text>
        </View>
      </View>

      {isDesktop ? (
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Icon name="assignment" size={24} color="#007AFF" />
            <View>
              <Text style={styles.statLabel}>Commandes créées</Text>
              <Text style={styles.statValue}>{orders.length}</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <Icon name="event-available" size={24} color="#1D4ED8" />
            <View>
              <Text style={styles.statLabel}>Confirmées</Text>
              <Text style={styles.statValue}>{confirmedOrders}</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <Icon name="restaurant" size={24} color="#D97706" />
            <View>
              <Text style={styles.statLabel}>Préparation</Text>
              <Text style={styles.statValue}>{productionOrders}</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <Icon name="check-circle" size={24} color="#16A34A" />
            <View>
              <Text style={styles.statLabel}>Terminées</Text>
              <Text style={styles.statValue}>{completedOrders}</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <Icon name="attach-money" size={24} color="#065F46" />
            <View>
              <Text style={styles.statLabel}>Valeur totale</Text>
              <Text style={styles.statValue}>{formatCurrency(totalAmount)}</Text>
            </View>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Commandes créées</Text>
            <Text style={styles.summaryValue}>{orders.length}</Text>

            <Text style={styles.summaryLabel}>Valeur totale</Text>
            <Text style={styles.summaryAmount}>
              {formatCurrency(totalAmount)}
            </Text>
          </View>

          <View style={[styles.summaryCard, styles.deliveredSummaryCard]}>
            <Text style={styles.summaryLabel}>Commandes terminées</Text>
            <Text style={styles.summaryAmount}>{completedOrders}</Text>
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

      {!isDesktop ? (
        <View style={styles.filterRow}>
          {filterItems.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.filterChip,
                statusFilter === item.value && styles.activeFilterChip,
              ]}
              onPress={() => setStatusFilter(item.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === item.value && styles.activeFilterChipText,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {displayedOrders.length === 0 ? (
        <Text style={styles.empty}>Aucune commande créée</Text>
      ) : isDesktop ? (
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View style={styles.kanbanBoard}>
            {KANBAN_COLUMNS.map((column) => {
              const columnOrders = kanbanOrders[column.key] || [];

              return (
                <View key={column.key} style={styles.kanbanColumn}>
                  <View style={styles.kanbanColumnHeader}>
                    <View style={styles.kanbanColumnTitleRow}>
                      <Icon name={column.icon} size={18} color="#111827" />
                      <Text style={styles.kanbanColumnTitle}>
                        {column.title}
                      </Text>
                    </View>

                    <View style={styles.kanbanCountBadge}>
                      <Text style={styles.kanbanCountText}>
                        {columnOrders.length}
                      </Text>
                    </View>
                  </View>

                  {columnOrders.length === 0 ? (
                    <Text style={styles.kanbanEmpty}>Aucune commande</Text>
                  ) : (
                    columnOrders.map((order) => renderKanbanCard(order))
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      ) : (
        displayedOrders.map((order) => renderOrderCard(order))
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
    marginBottom: 4,
  },

  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  summaryCard: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },

  deliveredSummaryCard: {
    backgroundColor: '#065F46',
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

  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },

  filterChip: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },

  activeFilterChip: {
    backgroundColor: '#111827',
  },

  filterChipText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '800',
  },

  activeFilterChipText: {
    color: '#fff',
  },

  empty: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 40,
  },

  kanbanBoard: {
    flexDirection: 'row',
    gap: 14,
    paddingBottom: 8,
  },

  kanbanColumn: {
    width: 350,
    minHeight: 560,
    backgroundColor: '#EEF2F7',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  kanbanColumnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  kanbanColumnTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  kanbanColumnTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111827',
  },

  kanbanCountBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  kanbanCountText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111827',
  },

  kanbanEmpty: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 20,
  },

  kanbanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  kanbanCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },

  kanbanTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
  },

  kanbanClient: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 10,
  },

  kanbanInfoGrid: {
    gap: 6,
    marginBottom: 10,
  },

  kanbanInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  kanbanInfoText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },

  kanbanAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 10,
  },

  kanbanActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  kanbanPrimaryButton: {
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  kanbanPrimaryText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '800',
  },

  kanbanSecondaryButton: {
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  kanbanSecondaryText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '800',
  },

  kanbanSuccessButton: {
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  kanbanSuccessText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '800',
  },

  kanbanDeleteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
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