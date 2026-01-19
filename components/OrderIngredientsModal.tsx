import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Order } from '@/types';
import { formatCurrency } from '@/src/utils/costs';
import Modal from '@/components/Modal';

interface OrderIngredientsModalProps {
  visible: boolean;
  order: Order;
  onClose: () => void;
}

interface AggregatedIngredient {
  id: string;
  name: string;
  unit: string;
  price: number;
  totalQuantity: number;
  totalPrice: number;
}

export default function OrderIngredientsModal({ visible, order, onClose }: OrderIngredientsModalProps) {
  // Aggregate ingredients from all dishes and additional ingredients
  const aggregatedIngredients = useMemo(() => {
    const ingredientMap: { [key: string]: AggregatedIngredient } = {};

    // Process dish ingredients
    if (order.dishes && Array.isArray(order.dishes)) {
      order.dishes.forEach(({ dish, quantity }) => {
        if (dish && dish.ingredients && Array.isArray(dish.ingredients)) {
          dish.ingredients.forEach(({ ingredient, quantity: ingredientQty }) => {
            if (ingredient && ingredient.id) {
              const totalQty = ingredientQty * quantity;
              if (ingredientMap[ingredient.id]) {
                ingredientMap[ingredient.id].totalQuantity += totalQty;
                ingredientMap[ingredient.id].totalPrice += (ingredient.price || 0) * totalQty;
              } else {
                ingredientMap[ingredient.id] = {
                  id: ingredient.id,
                  name: ingredient.name || 'N/A',
                  unit: ingredient.unit || '',
                  price: ingredient.price || 0,
                  totalQuantity: totalQty,
                  totalPrice: (ingredient.price || 0) * totalQty,
                };
              }
            }
          });
        }
      });
    }

    // Process additional ingredients
    if (order.additionalIngredients && Array.isArray(order.additionalIngredients)) {
      order.additionalIngredients.forEach(({ ingredient, quantity }) => {
        if (ingredient && ingredient.id) {
          if (ingredientMap[ingredient.id]) {
            ingredientMap[ingredient.id].totalQuantity += quantity;
            ingredientMap[ingredient.id].totalPrice += (ingredient.price || 0) * quantity;
          } else {
            ingredientMap[ingredient.id] = {
              id: ingredient.id,
              name: ingredient.name || 'N/A',
              unit: ingredient.unit || '',
              price: ingredient.price || 0,
              totalQuantity: quantity,
              totalPrice: (ingredient.price || 0) * quantity,
            };
          }
        }
      });
    }

    return Object.values(ingredientMap);
  }, [order]);

  const totalPrice = useMemo(() => {
    return aggregatedIngredients.reduce((sum, ing) => sum + ing.totalPrice, 0);
  }, [aggregatedIngredients]);

  return (
    <Modal visible={visible}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Ingrédients de la commande</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {aggregatedIngredients.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun ingrédient</Text>
            </View>
          ) : (
            <>
              <View style={styles.ingredientsList}>
                {aggregatedIngredients.map((ingredient) => (
                  <View key={ingredient.id} style={styles.ingredientItem}>
                    <View style={styles.ingredientInfo}>
                      <Text style={styles.ingredientName}>{ingredient.name}</Text>
                      <Text style={styles.ingredientUnit}>
                        {ingredient.totalQuantity.toFixed(2)} {ingredient.unit}
                      </Text>
                    </View>
                    <View style={styles.ingredientPriceContainer}>
                      <View style={styles.pricePerUnit}>
                        <Text style={styles.priceLabel}>@</Text>
                        <Text style={styles.priceValue}>{formatCurrency(ingredient.price)}</Text>
                      </View>
                      <View style={styles.totalPrice}>
                        <MaterialIcons name="attach-money" size={16} color="#007AFF" />
                        <Text style={styles.totalPriceValue}>
                          {formatCurrency(ingredient.totalPrice)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.summarySection}>
                <View style={styles.divider} />
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total des ingrédients</Text>
                  <View style={styles.totalAmount}>
                    <MaterialIcons name="attach-money" size={20} color="#007AFF" />
                    <Text style={styles.totalAmountValue}>
                      {formatCurrency(totalPrice)}
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
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
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  ingredientsList: {
    gap: 12,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  ingredientUnit: {
    fontSize: 12,
    color: '#666',
  },
  ingredientPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pricePerUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  totalPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  totalPriceValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  summarySection: {
    marginTop: 24,
    paddingTop: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 16,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  totalAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  totalAmountValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
});
