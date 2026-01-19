import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
//import Icon from 'react-native-vector-icons/MaterialIcons';
import { MaterialIcons as Icon } from '@expo/vector-icons';

import { Client } from '@/types';
import { useOrders } from '@/src/hooks/useFirestore';
import { updateClient } from '@/src/services/firestore';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import ErrorMessage from '@/src/components/ErrorMessage';
import Modal from '@/components/Modal';
import ClientForm from '@/components/ClientForm';

interface ClientDetailsProps {
  clientId: string;
  clients: Client[];
  onClose: () => void;
}

export default function ClientDetails({ clientId, clients, onClose }: ClientDetailsProps) {
  const [showEditForm, setShowEditForm] = useState(false);
  
  // Dynamic lookup from live clients array
  const client = useMemo(() => 
    clients.find(c => c.id === clientId),
    [clients, clientId]
  );

  if (!client) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Client Not Found</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { data: rawOrders = [], loading, error } = useOrders({
    where: ['clientId', '==', client.id],
  });

  // Sort orders client-side by createdAt descending
  const clientOrders = [...rawOrders].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  const calculateOrderTotal = (order: any) => {
    let dishesTotal = 0;
    if (order.dishes && Array.isArray(order.dishes)) {
      dishesTotal = order.dishes.reduce((total: number, { dish, quantity }: any) => {
        if (!dish || !dish.ingredients || !Array.isArray(dish.ingredients)) {
          return total;
        }
        const dishPrice = dish.ingredients.reduce((dishTotal: number, { ingredient, quantity: ingredientQty }: any) => {
          if (!ingredient || !ingredient.price) {
            return dishTotal;
          }
          return dishTotal + (ingredient.price * ingredientQty);
        }, 0);
        return total + (dishPrice * quantity);
      }, 0);
    }

    let ingredientsTotal = 0;
    if (order.additionalIngredients && Array.isArray(order.additionalIngredients)) {
      ingredientsTotal = order.additionalIngredients.reduce((total: number, { ingredient, quantity }: any) => {
        if (!ingredient || !ingredient.price) {
          return total;
        }
        return total + (ingredient.price * quantity);
      }, 0);
    }

    return dishesTotal + ingredientsTotal;
  };

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

  const handleUpdateClient = async (updatedData: Partial<Client>) => {
    try {
      await updateClient(client.id, updatedData);
      setShowEditForm(false);
    } catch (error) {
      console.error('Failed to update client:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Détails du client</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setShowEditForm(true)}>
            <Icon name="edit" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profile}>

          <Image
            source={client.profilePicture
              ? { uri: client.profilePicture }
              : require('@/assets/images/no_client_picture.jpg')}
            style={styles.profileImage}
          />

          <View style={styles.profileInfo}>
            <Text style={styles.name}>{client.name}</Text>
            <View style={styles.contactInfo}>
              <View style={styles.contactItem}>
                <Icon name="email" size={16} color="#666" />
                <Text style={styles.contactText}>{client.email}</Text>
              </View>
              <View style={styles.contactItem}>
                <Icon name="phone" size={16} color="#666" />
                <Text style={styles.contactText}>{client.phone}</Text>
              </View>
              <View style={styles.contactItem}>
                <Icon name="location-on" size={16} color="#666" />
                <Text style={styles.contactText}>{client.address}</Text>
              </View>
            </View>
          </View>
        </View>

        {client.notes && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="notes" size={20} color="#1a1a1a" />
              <Text style={styles.sectionTitle}>Notes</Text>
            </View>
            <Text style={styles.notes}>{client.notes}</Text>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="shopping-bag" size={20} color="#1a1a1a" />
            <Text style={styles.sectionTitle}>Historique des commandes</Text>
          </View>

          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorMessage message="Erreur lors du chargement des commandes" />
          ) : clientOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Aucune commande</Text>
            </View>
          ) : (
            <View style={styles.ordersList}>
              {clientOrders.map((order: any) => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}15` }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                        {order.status}
                      </Text>
                    </View>
                    <View style={styles.orderPrice}>
                      <Icon name="attach-money" size={16} color="#007AFF" />
                      <Text style={styles.priceText}>{calculateOrderTotal(order).toFixed(2)}</Text>
                    </View>
                  </View>

                  <View style={styles.orderContent}>
                    <View style={styles.orderMeta}>
                      <Icon name="calendar-today" size={16} color="#666" />
                      <Text style={styles.orderDate}>
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                      </Text>
                    </View>

                    <View style={styles.orderItems}>
                      <Text style={styles.itemsTitle}>Articles :</Text>
                      {order.dishes && Array.isArray(order.dishes) && order.dishes.map(({ dish, quantity }: any) => (
                        <Text key={dish?.id} style={styles.itemText}>
                          • {quantity}x {dish?.name || 'N/A'}
                        </Text>
                      ))}
                      {order.additionalIngredients && Array.isArray(order.additionalIngredients) && order.additionalIngredients.map(({ ingredient, quantity }: any) => (
                        <Text key={ingredient?.id} style={styles.itemText}>
                          • {quantity} {ingredient?.unit || ''} {ingredient?.name || 'N/A'}
                        </Text>
                      ))}
                    </View>

                    <View style={styles.deliveryInfo}>
                      <Icon name="schedule" size={16} color="#666" />
                      <Text style={styles.deliveryText}>
                        Livraison à {order.deliveryTime || 'N/A'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={showEditForm}>
        <ClientForm
          client={client}
          onClose={() => setShowEditForm(false)}
          onSubmit={handleUpdateClient}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
    zIndex: 10,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: '#1a1a1a',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  profile: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileInfo: {
    flex: 1,
    gap: 12,
  },
  name: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: '#1a1a1a',
  },
  contactInfo: {
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  section: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1a1a1a',
  },
  notes: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#666',
  },
  ordersList: {
    gap: 16,
  },
  orderCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  orderPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#007AFF',
  },
  orderContent: {
    padding: 12,
    gap: 12,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666',
  },
  orderItems: {
    gap: 4,
  },
  itemsTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  itemText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666',
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deliveryText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666',
  },
});