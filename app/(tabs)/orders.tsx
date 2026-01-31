import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons as Icon } from '@expo/vector-icons';

import { useOrders } from '@/src/hooks/useFirestore';
import Modal from '@/components/Modal';
import OrderDetails from '@/components/OrderDetails';
import OrderForm from '@/components/OrderForm';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import ErrorMessage from '@/src/components/ErrorMessage';
import { Order } from '@/types';
import { addOrder } from '@/src/services/firestore';
import { formatCurrency } from '@/src/utils/costs';

export default function OrdersScreen() {
  const router = useRouter();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);

  const { data: orders = [], loading, error } = useOrders({
    orderBy: ['createdAt', 'desc'],
  });

  const selectedOrder = selectedOrderId
    ? orders.find(o => o.id === selectedOrderId) || null
    : null;

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Error loading orders" />;

  const calculateOrderTotal = (order: Order) => {
    let total = 0;

    order.dishes?.forEach(({ dish, quantity }) => {
      dish?.ingredients?.forEach(({ ingredient, quantity: q }) => {
        if (ingredient?.price) {
          total += ingredient.price * q * quantity;
        }
      });
    });

    order.additionalIngredients?.forEach(({ ingredient, quantity }) => {
      if (ingredient?.price) {
        total += ingredient.price * quantity;
      }
    });

    return total;
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

  async function handleCreateOrder(values: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) {
    await addOrder(values);
    setShowOrderForm(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Commandes</Text>

        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.preparationButton}
            onPress={() => router.push('/preparation-ingredients')}
          >
            <Icon name="list" size={18} color="#fff" />
            <Text style={styles.preparationButtonText}>Ingrédients</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowOrderForm(true)}
          >
            <Icon name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {orders.map(order => {
          const totalItems = order.dishes.reduce((t, d) => t + d.quantity, 0);
          const totalAmount = calculateOrderTotal(order);

          return (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => setSelectedOrderId(order.id)}
            >
              {/* HEADER */}
              <View style={styles.orderHeader}>
                <Text style={styles.clientName}>{order.client.name}</Text>

                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${getStatusColor(order.status)}15` },
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

              {/* META */}
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>{totalItems} articles</Text>

                <View style={styles.priceRow}>
                  
                  <Text style={styles.priceText}>
                    {formatCurrency(totalAmount)}
                  </Text>
                </View>
              </View>

              {/* ✅ DESIGNATION (BON ENDROIT) */}
              {order.designation && (
                <Text style={styles.designation}>
                  {order.designation}
                </Text>
              )}

              {/* DATE / HEURE */}
              <View style={styles.deliveryRow}>
                <Icon name="event" size={14} color="#666" />
                <Text style={styles.deliveryText}>
                  {order.deliveryDate} à {order.deliveryTime}
                </Text>
              </View>

              {/* CTA */}
              <View style={styles.viewButton}>
                <Text style={styles.viewButtonText}>Voir les détails</Text>
                <Icon name="chevron-right" size={20} color="#007AFF" />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Modal visible={!!selectedOrder}>
        {selectedOrder && (
          <OrderDetails
            order={selectedOrder}
            onClose={() => setSelectedOrderId(null)}
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  preparationButton: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#FF9500',
    padding: 8,
    borderRadius: 8,
  },
  preparationButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metaText: {
    fontSize: 13,
    color: '#666',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontWeight: '600',
    color: '#007AFF',
  },
  designation: {
    marginTop: 8,
    fontSize: 14,
    fontStyle: 'italic',
    color: '#444',
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  deliveryText: {
    fontSize: 13,
    color: '#666',
  },
  viewButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  viewButtonText: {
    color: '#007AFF',
    fontWeight: '500',
  },
});
