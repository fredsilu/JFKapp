import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Order } from '@/types';
import { updateOrder, updateOrderStatus } from '@/src/services/firestore';
import { calculateOrderTotalCost, formatCurrency } from '@/src/utils/costs';
import Modal from '@/components/Modal';
import OrderForm from '@/components/OrderForm';
import OrderIngredientsModal from '@/components/OrderIngredientsModal';

interface OrderDetailsProps {
  order: Order;
  onClose: () => void;
}

export default function OrderDetails({ order, onClose }: OrderDetailsProps) {
  const [showEditForm, setShowEditForm] = useState(false);
  const [showIngredientsModal, setShowIngredientsModal] = useState(false);

  const STATUS_TRANSITIONS: Record<Order['status'], Order['status']> = {
    'En cours': 'En préparation',
    'En préparation': 'Livré',
    'Livré': 'Livré',
  };

  const handleUpdateStatus = async () => {
    const nextStatus = STATUS_TRANSITIONS[order.status];
    if (nextStatus && nextStatus !== order.status) {
      try {
        await updateOrderStatus(order.id, nextStatus);
      } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
      }
    }
  };

  const handleUpdateOrder = async (updatedOrder: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await updateOrder(order.id, updatedOrder);
      setShowEditForm(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la commande:', error);
    }
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

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Détails de la commande</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setShowIngredientsModal(true)}>
              <MaterialIcons name="list" size={20} color="#34C759" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setShowEditForm(true)}>
              <MaterialIcons name="edit" size={20} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="inventory" size={20} color="#1a1a1a" />
              <Text style={styles.sectionTitle}>Statut de la commande</Text>
            </View>

            <View style={styles.statusContainer}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: `${getStatusColor(order.status)}15` }
              ]}>
                <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                  {order.status}
                </Text>
              </View>

              {order.status !== 'Livré' && (
                <TouchableOpacity
                  style={[
                    styles.updateStatusButton,
                    { backgroundColor: getStatusColor(STATUS_TRANSITIONS[order.status]) }
                  ]}
                  onPress={handleUpdateStatus}>
                  <Text style={styles.updateStatusText}>
                    Marquer comme {STATUS_TRANSITIONS[order.status]}
                  </Text>
                  <MaterialIcons name="arrow-upward" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="person" size={20} color="#1a1a1a" />
              <Text style={styles.sectionTitle}>Client</Text>
            </View>

            <View style={styles.clientCard}>

              <Image
                source={order.client.profilePicture
                  ? { uri: order.client.profilePicture }
                  : require('@/assets/images/no_client_picture.jpg')}
                style={styles.clientImage}
              />


              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{order.client.name}</Text>
                <Text style={styles.clientMeta}>{order.client.phone}</Text>
                <Text style={styles.clientMeta}>{order.client.email}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="event" size={20} color="#1a1a1a" />
              <Text style={styles.sectionTitle}>Informations de livraison</Text>
            </View>

            <View style={styles.deliveryInfo}>
              <View style={styles.deliveryDetail}>
                <MaterialIcons name="access-time" size={16} color="#666" />
                <Text style={styles.deliveryText}>Livraison à {order.deliveryTime}</Text>
              </View>
              <View style={styles.deliveryDetail}>
                <MaterialIcons name="location-on" size={16} color="#666" />
                <Text style={styles.deliveryText}>{order.address}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Plats commandés</Text>
            <View style={styles.dishesList}>
              {order.dishes.map(({ dish, quantity }) => (
                <View key={dish.id} style={styles.dishCard}>
                  <Image source={{ uri: dish.image }} style={styles.dishImage} />
                  <View style={styles.dishInfo}>
                    <Text style={styles.dishName}>{dish.name}</Text>
                    <Text style={styles.dishQuantity}>Quantité: {quantity}</Text>
                    <View style={styles.dishPrice}>
                      <MaterialIcons name="attach-money" size={16} color="#007AFF" />
                      <Text style={styles.priceText}>
                        {formatCurrency(calculateOrderTotalCost({ ...order, dishes: [{ dish, quantity, name: dish.name, ingredients: dish.ingredients, additionalIngredients: [] }], additionalIngredients: [] }))}
                      </Text>
                    </View>
                  </View>
                  <MaterialIcons name="arrow-forward" size={20} color="#666" />
                </View>
              ))}
            </View>
          </View>

          {order.additionalIngredients.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingrédients supplémentaires</Text>
              <View style={styles.ingredientsList}>
                {order.additionalIngredients.map(({ ingredient, quantity }) => (
                  <View key={ingredient.id} style={styles.ingredientItem}>
                    <View style={styles.ingredientInfo}>
                      <Text style={styles.ingredientName}>{ingredient.name}</Text>
                      <Text style={styles.ingredientCategory}>{ingredient.category}</Text>
                    </View>
                    <View style={styles.ingredientQuantity}>
                      <Text style={styles.quantityText}>
                        {quantity} {ingredient.unit}
                      </Text>
                      <View style={styles.ingredientPrice}>
                        <MaterialIcons name="attach-money" size={14} color="#007AFF" />
                        <Text style={styles.priceText}>
                          {formatCurrency(ingredient.price * quantity)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="list" size={20} color="#1a1a1a" />
              <Text style={styles.sectionTitle}>Récapitulatif des ingrédients</Text>
            </View>
            <View style={styles.ingredientsList}>
              {order.dishes && Array.isArray(order.dishes) && 
                order.dishes.flatMap(({ dish, quantity }) => {
                  if (!dish || !dish.ingredients || !Array.isArray(dish.ingredients)) {
                    return [];
                  }
                  return dish.ingredients
                    .filter(({ ingredient }) => ingredient && ingredient.id)
                    .map(({ ingredient, quantity: ingredientQty }) => (
                      <View key={`${dish.id}-${ingredient.id}`} style={styles.ingredientItem}>
                        <View style={styles.ingredientInfo}>
                          <Text style={styles.ingredientName}>{ingredient?.name || 'N/A'}</Text>
                          <Text style={styles.ingredientCategory}>
                            De: {dish.name} (x{quantity})
                          </Text>
                        </View>
                        <View style={styles.ingredientQuantity}>
                          <Text style={styles.quantityText}>
                            {ingredientQty} {ingredient?.unit || ''}
                          </Text>
                          <View style={styles.ingredientPrice}>
                            <MaterialIcons name="attach-money" size={14} color="#007AFF" />
                            <Text style={styles.priceText}>
                              {formatCurrency((ingredient?.price || 0) * ingredientQty * quantity)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ));
                })
              }
              
              {order.additionalIngredients && Array.isArray(order.additionalIngredients) && 
                order.additionalIngredients
                  .filter(({ ingredient }) => ingredient && ingredient.id)
                  .map(({ ingredient, quantity: addQty }) => (
                  <View key={`add-${ingredient.id}`} style={styles.ingredientItem}>
                    <View style={styles.ingredientInfo}>
                      <Text style={styles.ingredientName}>{ingredient?.name || 'N/A'}</Text>
                      <Text style={styles.ingredientCategory}>Supplément</Text>
                    </View>
                    <View style={styles.ingredientQuantity}>
                      <Text style={styles.quantityText}>
                        {addQty} {ingredient?.unit || ''}
                      </Text>
                      <View style={styles.ingredientPrice}>
                        <MaterialIcons name="attach-money" size={14} color="#007AFF" />
                        <Text style={styles.priceText}>
                          {formatCurrency((ingredient?.price || 0) * addQty)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              }
            </View>
          </View>

          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total de la commande</Text>
            <View style={styles.totalAmount}>
              <MaterialIcons name="attach-money" size={24} color="#007AFF" />
              <Text style={styles.totalValue}>
                {formatCurrency(calculateOrderTotalCost(order))}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>

      <Modal visible={showEditForm}>
        <OrderForm
          order={order}
          onClose={() => setShowEditForm(false)}
          onSubmit={handleUpdateOrder}
        />
      </Modal>

      <OrderIngredientsModal
        visible={showIngredientsModal}
        order={order}
        onClose={() => setShowIngredientsModal(false)}
      />
    </>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    marginRight: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  updateStatusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  updateStatusText: {
    color: '#fff',
    marginRight: 8,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  clientImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  clientMeta: {
    fontSize: 14,
    color: '#666',
  },
  deliveryInfo: {
    marginTop: 8,
  },
  deliveryDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  deliveryText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  dishesList: {
    marginTop: 8,
  },
  dishCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
  },
  dishImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 16,
  },
  dishInfo: {
    flex: 1,
  },
  dishName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dishQuantity: {
    fontSize: 14,
    color: '#666',
  },
  dishPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  priceText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#007AFF',
  },
  ingredientsList: {
    marginTop: 8,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  ingredientCategory: {
    fontSize: 12,
    color: '#666',
  },
  ingredientQuantity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    marginRight: 8,
  },
  ingredientPrice: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalSection: {
    marginTop: 16,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  totalAmount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
