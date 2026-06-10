import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DishAnalytics, ClientAnalytics, IngredientUsage } from '@/src/utils/analytics';
import { formatCurrency } from '@/src/utils/costs';
import { formatShortDocumentDate } from '@/src/utils/dateFormat';

interface TopDishesListProps {
  dishes: DishAnalytics[];
}

export function TopDishesList({ dishes }: TopDishesListProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="star" size={20} color="#FF9500" />
        <Text style={styles.title}>Top 5 Plats</Text>
      </View>

      <View style={styles.list}>
        {dishes.map((dish, index) => (
          <View key={dish.dishId} style={styles.item}>
            <View style={styles.rank}>
              <Text style={styles.rankNumber}>#{index + 1}</Text>
            </View>

            <View style={styles.itemContent}>
              <Text style={styles.itemName}>{dish.dishName}</Text>
              <View style={styles.itemStats}>
                <View style={styles.stat}>
                  <MaterialIcons name="shopping-bag" size={14} color="#666" />
                  <Text style={styles.statText}>{dish.orderCount} commandes</Text>
                </View>
                <View style={styles.stat}>
                  <MaterialIcons name="attach-money" size={14} color="#34C759" />
                  <Text style={styles.statText}>{formatCurrency(dish.totalRevenue)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.itemValue}>
              <Text style={styles.revenue}>{formatCurrency(dish.totalRevenue)}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

interface TopClientsListProps {
  clients: ClientAnalytics[];
}

export function TopClientsList({ clients }: TopClientsListProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="people" size={20} color="#007AFF" />
        <Text style={styles.title}>Top 5 Clients</Text>
      </View>

      <View style={styles.list}>
        {clients.map((client, index) => (
          <View key={client.clientId} style={styles.item}>
            <View style={styles.rank}>
              <Text style={styles.rankNumber}>#{index + 1}</Text>
            </View>

            <View style={styles.itemContent}>
              <Text style={styles.itemName}>{client.clientName}</Text>
              <View style={styles.itemStats}>
                <View style={styles.stat}>
                  <MaterialIcons name="shopping-bag" size={14} color="#666" />
                  <Text style={styles.statText}>{client.orderCount} commandes</Text>
                </View>
                {client.lastOrderDate && (
                  <View style={styles.stat}>
                    <MaterialIcons name="event" size={14} color="#666" />
                    <Text style={styles.statText}>
                      {formatShortDocumentDate(new Date(client.lastOrderDate))}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.itemValue}>
              <Text style={styles.revenue}>{formatCurrency(client.totalSpent)}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

interface IngredientUsageListProps {
  ingredients: IngredientUsage[];
}

export function IngredientUsageList({ ingredients }: IngredientUsageListProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="kitchen" size={20} color="#9C27B0" />
        <Text style={styles.title}>Top 10 Ingrédients</Text>
      </View>

      <View style={styles.list}>
        {ingredients.map((ingredient, index) => {
          const maxUsage = Math.max(...ingredients.map(i => i.timesPurchased));
          const progressWidth = (ingredient.timesPurchased / maxUsage) * 100;

          return (
            <View key={ingredient.ingredientName} style={styles.item}>
              <View style={styles.ingredientContent}>
                <View style={styles.ingredientHeader}>
                  <Text style={styles.ingredientName}>{ingredient.ingredientName}</Text>
                  <Text style={styles.usageCount}>{ingredient.timesPurchased}x</Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${progressWidth}%`, backgroundColor: '#9C27B0' },
                    ]}
                  />
                </View>
                <Text style={styles.quantityText}>
                  Qty: {ingredient.totalQuantity.toFixed(2)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  list: {
    gap: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    gap: 12,
  },
  rank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF9500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  itemContent: {
    flex: 1,
    gap: 6,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  itemStats: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  itemValue: {
    alignItems: 'flex-end',
  },
  revenue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#34C759',
  },
  ingredientContent: {
    flex: 1,
    gap: 8,
  },
  ingredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  usageCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9C27B0',
    backgroundColor: '#F3E5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  quantityText: {
    fontSize: 11,
    color: '#999',
  },
});
