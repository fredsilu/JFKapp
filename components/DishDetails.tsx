import React, { useState } from 'react';

import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Dish } from '@/types';
import { updateDish } from '@/src/services/firestore';
import Modal from '@/components/Modal';
import DishForm from '@/components/DishForm';
import { useIngredients } from '@/src/hooks/useFirestore';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import ErrorMessage from '@/src/components/ErrorMessage';

interface DishDetailsProps {
  dish: Dish;
  onClose: () => void;
}

export default function DishDetails({ dish, onClose }: DishDetailsProps) {
  const [showEditForm, setShowEditForm] = useState(false);
  const { data: ingredients = [], loading, error } = useIngredients();

  const calculateTotalPrice = () => {
    return dish.ingredients.reduce((total, { ingredient, quantity }) => {
      return total + (ingredient.price * quantity);
    }, 0);
  };

  const handleUpdateDish = async (updatedDish: Omit<Dish, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await updateDish(dish.id, updatedDish);
      setShowEditForm(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du plat:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message="Erreur lors du chargement des ingrédients" />;
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Détails du plat</Text>
          <View style={styles.headerActions}>
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
          <Image 
            source={{ uri: dish.image }} 
            style={styles.dishImage}
          />

          <View style={styles.mainInfo}>
            <Text style={styles.dishName}>{dish.name}</Text>
            {dish.description && (
              <Text style={styles.description}>{dish.description}</Text>
            )}

            <View style={styles.statsContainer}>
              <View style={styles.stat}>
                <MaterialIcons name="access-time" size={20} color="#007AFF" />
                <Text style={styles.statValue}>{dish.preparationTime}</Text>
                <Text style={styles.statLabel}>min</Text>
              </View>

              <View style={styles.stat}>
                <MaterialIcons name="people" size={20} color="#007AFF" />
                <Text style={styles.statValue}>{dish.servings}</Text>
                <Text style={styles.statLabel}>portions</Text>
              </View>

              <View style={styles.stat}>
                <MaterialIcons name="attach-money" size={20} color="#007AFF" />
                <Text style={styles.statValue}>{calculateTotalPrice().toFixed(2)}</Text>
                <Text style={styles.statLabel}>€</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingrédients</Text>
            <View style={styles.ingredientsList}>
              {dish.ingredients.map(({ ingredient, quantity }) => (
                <View key={ingredient.id} style={styles.ingredientItem}>
                  <View style={styles.ingredientInfo}>
                    <Text style={styles.ingredientName}>{ingredient.name}</Text>
                    <Text style={styles.ingredientCategory}>{ingredient.category}</Text>
                  </View>
                  <View style={styles.quantityContainer}>
                    <Text style={styles.quantity}>{quantity}</Text>
                    <Text style={styles.unit}>{ingredient.unit}</Text>
                  </View>
                  <View style={styles.priceContainer}>
                    <MaterialIcons name="attach-money" size={16} color="#007AFF" />
                    <Text style={styles.price}>
                      {(ingredient.price * quantity).toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stock des ingrédients</Text>
            {dish.ingredients.map(({ ingredient, quantity }) => (
              <View key={ingredient.id} style={styles.stockItem}>
                <View style={styles.stockInfo}>
                  <Text style={styles.stockName}>{ingredient.name}</Text>
                  <Text style={styles.stockQuantity}>
                    Stock: {ingredient.stock} {ingredient.unit}
                  </Text>
                </View>
                <View style={styles.stockBarContainer}>
                  <View style={styles.stockBar}>
                    <View 
                      style={[
                        styles.stockLevel,
                        {
                          width: `${Math.min((ingredient.stock / 100) * 100, 100)}%`,
                          backgroundColor: ingredient.stock < 20 ? '#FF3B30' : '#34C759'
                        }
                      ]}
                    />
                  </View>
                  {ingredient.stock < 20 && (
                    <Text style={styles.stockWarning}>Stock bas</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <Modal visible={showEditForm}>
        <DishForm
          dish={dish}
          ingredients={ingredients}
          onClose={() => setShowEditForm(false)}
          onSubmit={handleUpdateDish}
        />
      </Modal>
    </>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    paddingHorizontal: 20,
  },
  ingredientsList: {
    marginTop: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 8,
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
    gap: 10,
  },
  editButton: {
    marginRight: 10,
  },
  dishImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  mainInfo: {
    padding: 20,
  },
  dishName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1a1a1a',
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#1a1a1a',
  },
  ingredientCategory: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#666',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantity: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#1a1a1a',
    marginRight: 4,
  },
  unit: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#666',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#1a1a1a',
  },
  stockItem: {
    marginBottom: 12,
  },
  stockInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stockName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#1a1a1a',
  },
  stockQuantity: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#666',
  },
  stockBarContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  stockBar: {
    height: '100%',
    backgroundColor: '#34C759',
  },
  stockLevel: {
    height: '100%',
  },
  stockWarning: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
});

