import React from 'react';
import { View, Text, Platform, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useOrders, useClients, useDishes } from '@/src/hooks/useFirestore';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import ErrorMessage from '@/src/components/ErrorMessage';
import { useRouter } from 'expo-router';
import { getFirestore, collection, runTransaction, doc, serverTimestamp } from "firebase/firestore";
import app from '@/lib/firebase'; // Assurez-vous d'importer votre configuration Firebase
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function DashboardScreen() {
  const router = useRouter();
  const { data: orders = [], loading: loadingOrders, error: ordersError } = useOrders({
    orderBy: ['createdAt', 'desc']
  });
  const { data: clients = [], loading: loadingClients, error: clientsError } = useClients();
  const { data: dishes = [], loading: loadingDishes, error: dishesError } = useDishes();

  if (loadingOrders || loadingClients || loadingDishes) {
    return <LoadingSpinner />;
  }

  if (ordersError || clientsError || dishesError) {
    return <ErrorMessage message="Error loading dashboard data" />;
  }

  const activeOrders = orders.filter(order => order.status !== 'Livré');
  const todayOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });

  const calculateDailyRevenue = () => {
    return todayOrders.reduce((total, order) => {
      const dishesTotal = order.dishes.reduce((orderTotal, { dish, quantity }) => {
        const dishPrice = dish.ingredients.reduce((dishTotal, { ingredient, quantity: ingredientQty }) => {
          return dishTotal + (ingredient.price * ingredientQty);
        }, 0);
        return orderTotal + (dishPrice * quantity);
      }, 0);

      const ingredientsTotal = order.additionalIngredients.reduce((total, { ingredient, quantity }) => {
        return total + (ingredient.price * quantity);
      }, 0);

      return total + dishesTotal + ingredientsTotal;
    }, 0);
  };

  const dailyRevenue = calculateDailyRevenue();
  const previousDayRevenue = dailyRevenue * 0.8; // Mock data for comparison
  const revenueChange = ((dailyRevenue - previousDayRevenue) / previousDayRevenue) * 100;

  return (
    <View style={styles.container}>
     

      <ScrollView style={styles.container}>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.revenueCard]}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Today's Revenue</Text>
              <View style={[
                styles.changeBadge,
                { backgroundColor: revenueChange >= 0 ? '#34C75915' : '#FF3B3015' }
              ]}>
                {revenueChange >= 0 ? (
                  <Icon name="trending-up" size={16} color="#34C759" />
                ) : (
                  <Icon name="trending-down" size={16} color="#FF3B30" />
                )}
                <Text style={[
                  styles.changeText,
                  { color: revenueChange >= 0 ? '#34C759' : '#FF3B30' }
                ]}>
                  {Math.abs(revenueChange).toFixed(1)}%
                </Text>
              </View>
            </View>
            <View style={styles.revenueAmount}>
              <Icon name="attach-money" size={24} color="#007AFF" />
              <Text style={styles.revenueText}>{dailyRevenue.toFixed(2)}</Text>
            </View>
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
            <Text style={styles.statNumber}>{todayOrders.length}</Text>
            <Text style={styles.statLabel}>Today's Orders</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => router.push('/all-orders')}>
              <Text style={styles.seeAllText}>See All</Text>
              <Icon name="chevron-right" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {orders.slice(0, 5).map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <Image
                source={order.client.profilePicture
                  ? { uri: order.client.profilePicture }
                  : require('@/assets/images/no_client_picture.jpg')}
                style={styles.clientImage}
              />

              <View style={styles.orderInfo}>
                <Text style={styles.clientName}>{order.client.name}</Text>
                <Text style={styles.orderMeta}>
                  {order.dishes.reduce((total, { quantity }) => total + quantity, 0)} items
                  • Delivery at {order.deliveryTime}
                </Text>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(order.status) + '15' }
              ]}>
                <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                  {order.status}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Dishes</Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => router.push('/all-dishes')}>
              <Text style={styles.seeAllText}>See All</Text>
              <Icon name="chevron-right" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dishesContainer}>
            {dishes.slice(0, 5).map((dish) => (
              <View key={dish.id} style={styles.dishCard}>
                <Image
                  source={{ uri: dish.image }}
                  style={styles.dishImage}
                />
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
    paddingTop: Platform.OS === 'android' ? 25 : 10, // Add top space for Android
    marginTop: Platform.OS === 'android' ? 15 : 15, // Add top space for iOS
  },
  header_content: {
    padding: 20,
    backgroundColor: '#333',
    alignItems: 'center',
    color: '#FFFFFF',
  },
  printButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666',
  },
  printButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  revenueCard: {
    alignItems: 'stretch',
    marginBottom: 4,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  changeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  revenueAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  revenueText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    color: '#1a1a1a',
  },
  statNumber: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#1a1a1a',
    marginVertical: 8,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginTop: 12,
    backgroundColor: '#fff',
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1a1a1a',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
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
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  orderMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dishImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  dishInfo: {
    padding: 12,
  },
  dishName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  dishMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666',
  },
});
