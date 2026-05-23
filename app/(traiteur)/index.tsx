// app/(traiteur)/index.tsx

import React from 'react';
import {
  View,
  Text,
  Platform,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useOrders, useClients, useDishes } from '@/src/hooks/useFirestore';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import ErrorMessage from '@/src/components/ErrorMessage';
import { useRouter } from 'expo-router';
import { MaterialIcons as Icon } from '@expo/vector-icons';

export default function DashboardScreen() {
  const router = useRouter();

  const { data: orders = [], loading: loadingOrders, error: ordersError } =
    useOrders({ orderBy: ['createdAt', 'desc'] });

  const { data: clients = [], loading: loadingClients, error: clientsError } =
    useClients();

  const { data: dishes = [], loading: loadingDishes, error: dishesError } =
    useDishes();

  if (loadingOrders || loadingClients || loadingDishes) {
    return <LoadingSpinner />;
  }

  if (ordersError || clientsError || dishesError) {
    return <ErrorMessage message="Erreur lors du chargement du dashboard" />;
  }

  function toDate(value: any): Date | null {
    if (!value) return null;

    if (value?.toDate) return value.toDate();

    if (value instanceof Date) return value;

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function isTodayDate(date: any) {
    const d = toDate(date);
    if (!d) return false;

    const today = new Date();

    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  }

  function isCurrentMonthDate(date: any) {
    const d = toDate(date);
    if (!d) return false;

    const today = new Date();

    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth()
    );
  }

  function normalizeStatus(status?: string) {
    return status || 'En cours';
  }

  function isDeliveredOrder(order: any) {
    const status = normalizeStatus(order.status);

    return (
      status === 'Livré' ||
      status === 'delivered' ||
      status === 'Facturé' ||
      status === 'invoiced'
    );
  }

  function isClosedOrder(order: any) {
    const status = normalizeStatus(order.status);

    return (
      status === 'Livré' ||
      status === 'delivered' ||
      status === 'Facturé' ||
      status === 'invoiced' ||
      status === 'Annulé' ||
      status === 'cancelled'
    );
  }

  function getOrderAmount(order: any) {
    return Number(
      order.billedAmount ||
      order.totals?.total ||
      order.simulatedAmount ||
      order.pricingReference?.totalHT ||
      0
    );
  }

  function getOrderDate(order: any) {
    return (
      order.updatedAt ||
      order.confirmedAt ||
      order.deliveryDate ||
      order.eventDate ||
      order.createdAt
    );
  }

  function getOrderItemsCount(order: any) {
    const itemsCount = (order.items || []).reduce(
      (total: number, item: any) => total + Number(item.quantity || 0),
      0
    );

    const dishesCount = (order.dishes || []).reduce(
      (total: number, dish: any) => total + Number(dish.quantity || 0),
      0
    );

    return itemsCount || dishesCount || 0;
  }

  function getClientName(order: any) {
    return (
      order.client?.name ||
      order.clientName ||
      order.name ||
      order.clientId ||
      'Client inconnu'
    );
  }

  function getClientProfilePicture(order: any) {
    return order.client?.profilePicture || '';
  }

  function getDeliveryLabel(order: any) {
    const date =
      order.deliveryDate ||
      order.dateLivraison ||
      order.eventDate ||
      '—';

    const time =
      order.deliveryTime ||
      order.eventTime ||
      order.heureLivraison ||
      '—';

    return `${date} à ${time}`;
  }

  const activeOrders = orders.filter((order) => !isClosedOrder(order));

  const todaysRevenue = orders
    .filter(
      (order) =>
        isDeliveredOrder(order) &&
        getOrderAmount(order) > 0 &&
        isTodayDate(getOrderDate(order))
    )
    .reduce((sum, order) => sum + getOrderAmount(order), 0);

  const monthRevenue = orders
    .filter(
      (order) =>
        isDeliveredOrder(order) &&
        getOrderAmount(order) > 0 &&
        isCurrentMonthDate(getOrderDate(order))
    )
    .reduce((sum, order) => sum + getOrderAmount(order), 0);

  const todaysOrdersCount = orders.filter(
    (order) => isDeliveredOrder(order) && isTodayDate(getOrderDate(order))
  ).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Vue d’ensemble Traiteur</Text>
        </View>

        <TouchableOpacity
          style={styles.analyticsButton}
          onPress={() => router.push('/analytics')}
        >
          <Icon name="analytics" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.revenueCard]}>
            <Text style={styles.statLabel}>Chiffre d’affaires du jour</Text>

            <View style={styles.revenueAmount}>
              <Text style={styles.currencySymbol}>$</Text>
              <Text style={styles.revenueText}>
                {todaysRevenue.toFixed(2)}
              </Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.statLabel}>Chiffre d’affaires du mois</Text>

            <View style={styles.revenueAmountSmall}>
              <Text style={styles.currencySymbolSmall}>$</Text>
              <Text style={[styles.revenueText, { fontSize: 20 }]}>
                {monthRevenue.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <Icon name="inventory" size={24} color="#007AFF" />
            <Text style={styles.statNumber}>{activeOrders.length}</Text>
            <Text style={styles.statLabel}>Commandes actives</Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="people" size={24} color="#007AFF" />
            <Text style={styles.statNumber}>{clients.length}</Text>
            <Text style={styles.statLabel}>Clients</Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="schedule" size={24} color="#007AFF" />
            <Text style={styles.statNumber}>{todaysOrdersCount}</Text>
            <Text style={styles.statLabel}>Commandes du jour</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Commandes récentes</Text>

            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => router.push('/(traiteur)/orders')}
            >
              <Text style={styles.seeAllText}>Voir tout</Text>
              <Icon name="chevron-right" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {orders.slice(0, 5).length === 0 ? (
            <Text style={styles.emptyText}>Aucune commande récente</Text>
          ) : (
            orders.slice(0, 5).map((order) => {
              const clientName = getClientName(order);
              const clientProfilePicture = getClientProfilePicture(order);
              const status = normalizeStatus(order.status);
              const itemsCount = getOrderItemsCount(order);

              return (
                <TouchableOpacity
                  key={order.id}
                  style={styles.orderCard}
                  activeOpacity={0.8}
                  onPress={() =>
                    router.push({
                      pathname: '/(traiteur)/orders/[id]',
                      params: { id: order.id },
                    })
                  }
                >
                  <Image
                    source={
                      clientProfilePicture
                        ? { uri: clientProfilePicture }
                        : require('@/assets/images/no_client_picture.jpg')
                    }
                    style={styles.clientImage}
                  />

                  <View style={styles.orderInfo}>
                    <Text style={styles.clientName}>{clientName}</Text>

                    <Text style={styles.orderMeta}>
                      {itemsCount} article(s) • {getDeliveryLabel(order)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          getStatusColor(status) + '15',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(status) },
                      ]}
                    >
                      {getStatusLabel(status)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Plats populaires</Text>

            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => router.push('/(traiteur)/dishes')}
            >
              <Text style={styles.seeAllText}>Voir tout</Text>
              <Icon name="chevron-right" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dishesContainer}
          >
            {dishes.slice(0, 5).map((dish) => (
              <TouchableOpacity
                key={dish.id}
                style={styles.dishCard}
                activeOpacity={0.85}
                onPress={() => router.push('/(traiteur)/dishes')}
              >
                <Image
                  source={
                    dish.image
                      ? { uri: dish.image }
                      : require('@/assets/images/no_dishes_picture.jpg')
                  }
                  style={styles.dishImage}
                />

                <View style={styles.dishInfo}>
                  <Text style={styles.dishName}>
                    {dish.name || 'Plat sans nom'}
                  </Text>

                  <Text style={styles.dishMeta}>
                    {dish.preparationTime || 0} min •{' '}
                    {dish.servings || 0} portion(s)
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'En cours':
    case 'draft':
      return 'En cours';

    case 'En préparation':
    case 'in-production':
      return 'En préparation';

    case 'confirmed':
    case 'confirmed-order':
      return 'Confirmée';

    case 'Livré':
    case 'delivered':
      return 'Livrée';

    case 'Facturé':
    case 'invoiced':
      return 'Facturée';

    case 'Annulé':
    case 'cancelled':
      return 'Annulée';

    default:
      return status || 'En cours';
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'En cours':
    case 'draft':
      return '#007AFF';

    case 'confirmed':
    case 'confirmed-order':
      return '#5856D6';

    case 'En préparation':
    case 'in-production':
      return '#FF9500';

    case 'Livré':
    case 'delivered':
      return '#34C759';

    case 'Facturé':
    case 'invoiced':
      return '#1E40AF';

    case 'Annulé':
    case 'cancelled':
      return '#EF4444';

    default:
      return '#666';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: Platform.OS === 'android' ? 25 : 10,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
  },

  subtitle: {
    fontSize: 14,
    color: '#666',
  },

  analyticsButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 10,
  },

  statsGrid: {
    padding: 20,
    gap: 12,
  },

  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
  },

  revenueCard: {
    alignItems: 'stretch',
  },

  statLabel: {
    fontSize: 14,
    color: '#666',
  },

  revenueAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  revenueAmountSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  currencySymbol: {
    fontSize: 24,
    fontWeight: '800',
    color: '#007AFF',
  },

  currencySymbolSmall: {
    fontSize: 18,
    fontWeight: '800',
    color: '#007AFF',
  },

  revenueText: {
    fontSize: 32,
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },

  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginVertical: 8,
  },

  section: {
    marginTop: 12,
    backgroundColor: '#fff',
    paddingVertical: 20,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },

  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  seeAllText: {
    color: '#007AFF',
  },

  emptyText: {
    textAlign: 'center',
    color: '#666',
    paddingVertical: 20,
  },

  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  clientImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },

  orderInfo: {
    flex: 1,
  },

  clientName: {
    fontSize: 16,
    fontWeight: '500',
  },

  orderMeta: {
    fontSize: 14,
    color: '#666',
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },

  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },

  dishesContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },

  dishCard: {
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },

  dishImage: {
    width: '100%',
    height: 120,
  },

  dishInfo: {
    padding: 12,
  },

  dishName: {
    fontSize: 16,
    fontWeight: '500',
  },

  dishMeta: {
    fontSize: 14,
    color: '#666',
  },
});