import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useDishes, useIngredients } from '@/src/hooks/useFirestore';
import { addDish } from '@/src/services/firestore';
import Modal from '@/components/Modal';
import DishForm from '@/components/DishForm';
import DishDetails from '@/components/DishDetails';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import ErrorMessage from '@/src/components/ErrorMessage';
import { Dish } from '@/types';
import { useRouter } from 'expo-router';

const DEFAULT_DISH_IMAGE = 'https://images.unsplash.com/photo-1546241072-48010ad2862c?w=400&h=300&q=80&fit=crop';

export default function DishesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);

  const router = useRouter();

  const { data: dishes = [], loading: dishesLoading, error: dishesError } = useDishes({
    orderBy: ['name', 'asc']
  });
  const { data: ingredients = [], loading: ingredientsLoading, error: ingredientsError } = useIngredients({
    orderBy: ['name', 'asc']
  });

  const filteredDishes = dishes.filter(dish =>
    (dish.name && dish.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (dish.description && dish.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get the current dish object from the updated list
  const selectedDish = selectedDishId
    ? dishes.find(d => d.id === selectedDishId) || null
    : null;

  const calculateDishPrice = (dish: Dish) => {
    if (!dish?.ingredients || dish.ingredients.length === 0) {
      return 0;
    }
    return dish.ingredients.reduce((total, { ingredient, quantity }) => {
      if (!ingredient || !ingredient.price) {
        return total;
      }
      return total + (ingredient.price * quantity);
    }, 0);
  };

  const handleCreateDish = async (values: Omit<Dish, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('Creating dishe', values);
      await addDish(values);
      alert('Dishe added successfully');
      setIsFormModalVisible(false);
    } catch (err) {
      console.error('Error creating dish:', err);
    }
  };

  if (dishesLoading || ingredientsLoading) {
    return <LoadingSpinner />;
  }

  if (dishesError || ingredientsError) {
    return <ErrorMessage message="Error loading data" />;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => router.replace('/(traiteur)/config')}
        style={styles.backButton}
      >
        <Text style={styles.backIcon}>←</Text>
        <Text style={styles.backText}>Configuration</Text>
      </TouchableOpacity>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un plat..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsFormModalVisible(true)}>
          <MaterialIcons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}>
        {filteredDishes.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="error-outline" size={48} color="#666" />
            <Text style={styles.emptyStateText}>Aucun plat trouvé</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredDishes.map((dish) => (
              <TouchableOpacity
                key={dish.id}
                style={styles.dishCard}
                onPress={() => setSelectedDishId(dish.id)}>
                <Image
                  source={{ uri: dish.image || DEFAULT_DISH_IMAGE }}
                  style={styles.dishImage}
                  defaultSource={{ uri: DEFAULT_DISH_IMAGE }}
                />
                <View style={styles.dishInfo}>
                  <Text style={styles.dishName} numberOfLines={1}>
                    {dish.name}
                  </Text>
                  <View style={styles.priceContainer}>
                    <MaterialIcons name="attach-money" size={16} color="#007AFF" />
                    <Text style={styles.dishPrice}>
                      {calculateDishPrice(dish).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={isFormModalVisible}>
        <DishForm
          ingredients={ingredients}
          onClose={() => setIsFormModalVisible(false)}
          onSubmit={handleCreateDish}
        />
      </Modal>

      <Modal visible={!!selectedDish}>
        {selectedDish && (
          <DishDetails
            dish={selectedDish}
            onClose={() => setSelectedDishId(null)}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    marginTop: 40,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
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
  },
  contentContainer: {
    padding: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  dishCard: {
    width: '47.5%',
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
    height: 160,
    resizeMode: 'cover',
  },
  dishInfo: {
    padding: 12,
  },
  dishName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dishPrice: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#007AFF',
  },
  backButton: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 12,
},

backIcon: {
  fontSize: 24,
  marginRight: 10,
  color: '#111827',
},

backText: {
  fontSize: 16,
  fontWeight: '700',
  color: '#111827',
},
});