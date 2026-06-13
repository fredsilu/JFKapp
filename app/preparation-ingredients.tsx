//app/preparation-ingredients.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useOrders } from '@/src/hooks/useFirestore';
import { formatCurrency } from '@/src/utils/costs';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import ErrorMessage from '@/src/components/ErrorMessage';

interface AggregatedIngredient {
  id: string;
  name: string;
  unit: string;
  price: number;
  totalQuantity: number;
  totalPrice: number;
}

export default function PreparationIngredientsScreen() {
  const { data: orders = [], loading, error } = useOrders({
    where: ['status', '==', 'in-production'],
  });

  // Aggregate ingredients from all "in-production" orders
  const aggregatedIngredients = useMemo(() => {
    const ingredientMap: { [key: string]: AggregatedIngredient } = {};

    orders.forEach((order) => {
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
    });

    // Sort by name
    return Object.values(ingredientMap).sort((a, b) => a.name.localeCompare(b.name));
  }, [orders]);

  const totalPrice = useMemo(() => {
    return aggregatedIngredients.reduce((sum, ing) => sum + ing.totalPrice, 0);
  }, [aggregatedIngredients]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message="Error loading orders in preparation" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Ingrédients en préparation</Text>
          <Text style={styles.subtitle}>
            {orders.length} commande{orders.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <MaterialIcons name="local-shipping" size={20} color="#fff" />
            <Text style={styles.badgeText}>{orders.length}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {aggregatedIngredients.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="inbox" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Aucune commande en préparation</Text>
          </View>
        ) : (
          <>
            <View style={styles.ingredientsList}>
              {aggregatedIngredients.map((ingredient) => (
                <View key={ingredient.id} style={styles.ingredientItem}>
                  <View style={styles.ingredientIconContainer}>
                    <MaterialIcons name="kitchen" size={20} color="#fff" />
                  </View>

                  <View style={styles.ingredientInfo}>
                    <Text style={styles.ingredientName}>{ingredient.name}</Text>
                    <Text style={styles.ingredientQuantity}>
                      {ingredient.totalQuantity.toFixed(2)} {ingredient.unit}
                    </Text>
                    <View style={styles.ingredientMeta}>
                      <Text style={styles.ingredientPrice}>
                        {formatCurrency(ingredient.price)}/unit
                      </Text>
                    </View>
                  </View>

                  <View style={styles.ingredientTotalContainer}>
                    <Text style={styles.ingredientTotalLabel}>Total</Text>
                    <View style={styles.ingredientTotalPrice}>
                      <MaterialIcons name="attach-money" size={16} color="#007AFF" />
                      <Text style={styles.ingredientTotalValue}>
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
                  <MaterialIcons name="attach-money" size={20} color="#fff" />
                  <Text style={styles.totalAmountValue}>
                    {formatCurrency(totalPrice)}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryInfo}>
                <View style={styles.summaryItem}>
                  <MaterialIcons name="shopping-bag" size={16} color="#666" />
                  <Text style={styles.summaryText}>
                    {aggregatedIngredients.length} ingrédient{aggregatedIngredients.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <MaterialIcons name="local-shipping" size={16} color="#666" />
                  <Text style={styles.summaryText}>
                    {orders.length} commande{orders.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
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
    paddingTop: 24,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#999',
  },
  badgeContainer: {
    alignItems: 'flex-end',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF9500',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  ingredientsList: {
    gap: 10,
    marginBottom: 20,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  ingredientIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
  ingredientQuantity: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    marginBottom: 2,
  },
  ingredientMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ingredientPrice: {
    fontSize: 11,
    color: '#999',
  },
  ingredientTotalContainer: {
    alignItems: 'flex-end',
  },
  ingredientTotalLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 3,
  },
  ingredientTotalPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  ingredientTotalValue: {
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
    paddingVertical: 14,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  totalAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  totalAmountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  summaryInfo: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  summaryText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});
