import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useOrders } from '@/src/hooks/useFirestore';
import Modal from '@/components/Modal';
import OrderDetails from '@/components/OrderDetails';
import OrderForm from '@/components/OrderForm';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import ErrorMessage from '@/src/components/ErrorMessage';
import { Order } from '@/types';
import { addOrder } from '@/src/services/firestore';

export default function OrdersScreen() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const { data: orders = [], loading, error } = useOrders({
    orderBy: ['createdAt', 'desc']
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message="Error loading orders" />;
  }

  const calculateOrderTotal = (order: Order) => {
    const dishesTotal = order.dishes.reduce((total, { dish, quantity }) => {
      const dishPrice = dish.ingredients.reduce((dishTotal, { ingredient, quantity: ingredientQty }) => {
        return dishTotal + (ingredient.price * ingredientQty);
      }, 0);
      return total + (dishPrice * quantity);
    }, 0);

    const ingredientsTotal = order.additionalIngredients.reduce((total, { ingredient, quantity }) => {
      return total + (ingredient.price * quantity);
    }, 0);

    return dishesTotal + ingredientsTotal;
  };

  const getStatusColor = (status: Order['status']) => {
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

  async function handleCreateOrder(values: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      await addOrder(values);
      setShowOrderForm(false);
    } catch (error) {
      console.error('Error creating order:', error);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Commandes</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowOrderForm(true)}>
            <Icon name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {orders.map((order) => (
          <TouchableOpacity 
            key={order.id} 
            style={styles.orderCard}
            onPress={() => setSelectedOrder(order)}>
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.clientName}>{order.client.name}</Text>
                <View style={styles.orderMeta}>
                  <Text style={styles.orderItems}>
                    {order.dishes.reduce((total, dish) => total + dish.quantity, 0)} articles
                  </Text>
                  <View style={styles.priceContainer}>
                    <Icon name="attach-money" size={16} color="#007AFF" />
                    <Text style={styles.orderTotal}>
                      {calculateOrderTotal(order).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}15` }]}>
                <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                  {order.status}
                </Text>
              </View>
            </View>

            <View style={styles.orderDetails}>
              <View style={styles.detailRow}>
                <Icon name="access-time" size={16} color="#666" />
                <Text style={styles.detailText}>Livraison à {order.deliveryTime}</Text>
              </View>
              <View style={styles.detailRow}>
                <Icon name="location-on" size={16} color="#666" />
                <Text style={styles.detailText}>{order.address}</Text>
              </View>
            </View>

            <View style={styles.viewButton}>
              <Text style={styles.viewButtonText}>Voir les détails</Text>
              <Icon name="chevron-right" size={20} color="#007AFF" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={!!selectedOrder}>
        {selectedOrder && (
          <OrderDetails
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </Modal>

      <Modal visible={showOrderForm}>
        <OrderForm 
          onClose={() => setShowOrderForm(false)} 
          onSubmit={handleCreateOrder}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    marginTop: 30,
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: '#1a1a1a',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  clientName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderItems: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderTotal: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#007AFF',
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
  orderDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  viewButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#007AFF',
  },
});
