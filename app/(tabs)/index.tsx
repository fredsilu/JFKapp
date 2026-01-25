import React from 'react';
import { View, Text, Platform, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useOrders, useClients, useDishes } from '@/src/hooks/useFirestore';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import ErrorMessage from '@/src/components/ErrorMessage';
import { useRouter } from 'expo-router';
import { MaterialIcons as Icon } from '@expo/vector-icons';

export default function DashboardScreen() {
  const router = useRouter();

  const { data: orders = [], loading: loadingOrders, error: ordersError } = useOrders({
    orderBy: ['createdAt', 'desc'],
  });
  const { data: clients = [], loading: loadingClients, error: clientsError } = useClients();
  const { data: dishes = [], loading: loadingDishes, error: dishesError } = useDishes();

  if (loadingOrders || loadingClients || loadingDishes) {
    return <LoadingSpinner />;
  }

  if (ordersError || clientsError || dishesError) {
    return <ErrorMessage message="Error loading dashboard data" />;
  }

  /* =======================
     Helpers dates
  ======================= */
  const isToday = (dateStr: string) => {
    const today = new Date();
    const d = new Date(dateStr);
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  };

  const isCurrentMonth = (dateStr: string) => {
    const today = new Date();
    const d = new Date(dateStr);
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth()
    );
  };

  /* =======================
     KPI Calculations
  ======================= */
  const activeOrders = orders.filter(order => order.status !== 'Livré');

  const todaysRevenue = orders
    .filter(
      o =>
        o.status === 'Livré' &&
        o.billedAmount !== undefined &&
        o.deliveryDate &&
        isToday(o.deliveryDate)
    )
    .reduce((sum, o) => sum + (o.billedAmount || 0), 0);

  const monthRevenue = orders
    .filter(
      o =>
        o.status === 'Livré' &&
        o.billedAmount !== undefined &&
        o.deliveryDate &&
        isCurrentMonth(o.deliveryDate)
    )
    .reduce((sum, o) => sum + (o.billedAmount || 0), 0);

  const todaysOrdersCount = orders.filter(
    o => o.deliveryDate && isToday(o.deliveryDate)
  ).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Restaurant Overview</Text>
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
          {/* Revenue Card */}
          <View style={[styles.statCard, styles.revenueCard]}>
            <Text style={styles.statLabel}>Today's Revenue</Text>
            <View style={styles.revenueAmount}>
              <Icon name="attach-money" size={24} color="#007AFF" />
              <Text style={styles.revenueText}>{todaysRevenue.toFixed(2)}</Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.statLabel}>Month Revenue</Text>
            <Text style={[styles.revenueText, { fontSize: 20 }]}>
              {monthRevenue.toFixed(2)}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="inventory" size={24} color="#007AFF" />
            <Text style={styles.statNumber}>{activeOrders.length}</Text>
            <Text style={styles.statLabel}>Active Orders</Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="people" size={24} color="#007AFF" />
            <Text style={styles.statNumber}>{clients.length}</Text>
            <Text style={styles.statLabel}>Total Clients</Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="schedule" size={24} color="#007AFF" />
            <Text style={styles.statNumber}>{todaysOrdersCount}</Text>
            <Text style={styles.statLabel}>Today's Orders</Text>
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => router.push('/all-orders')}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <Icon name="chevron-right" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {orders.slice(0, 5).map(order => (
            <View key={order.id} style={styles.orderCard}>
              <Image
                source={
                  order.client.profilePicture
                    ? { uri: order.client.profilePicture }
                    : require('@/assets/images/no_client_picture.jpg')
                }
                style={styles.clientImage}
              />

              <View style={styles.orderInfo}>
                <Text style={styles.clientName}>{order.client.name}</Text>
                <Text style={styles.orderMeta}>
                  {order.dishes.reduce((t, d) => t + d.quantity, 0)} items •{' '}
                  {order.deliveryDate} at {order.deliveryTime}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(order.status) + '15' },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(order.status) },
                  ]}
                >
                  {order.status}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Popular Dishes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Dishes</Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => router.push('/all-dishes')}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <Icon name="chevron-right" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dishesContainer}>
            {dishes.slice(0, 5).map(dish => (
              <View key={dish.id} style={styles.dishCard}>
                <Image source={{ uri: dish.image }} style={styles.dishImage} />
                <View style={styles.dishInfo}>
                  <Text style={styles.dishName}>{dish.name}</Text>
                  <Text style={styles.dishMeta}>
                    {dish.preparationTime} min • {dish.servings} servings
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

/* =======================
   Helpers UI
======================= */
const getStatusColor = (status: string) => {
  switch (status) {
    case 'En cours':
      return '#007AFF';
    case 'En préparation':
      return '#FF9500';
    case 'Livré':
      return '#34C759';
    default:
      return '#666';
  }
};

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
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#1a1a1a',
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
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
  revenueText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
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
