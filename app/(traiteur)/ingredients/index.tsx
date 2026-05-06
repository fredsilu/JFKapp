import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
//import Icon from 'react-native-vector-icons/MaterialIcons';
import { MaterialIcons as Icon } from '@expo/vector-icons';

import { useIngredients } from '@/src/hooks/useFirestore';
import { addIngredient } from '@/src/services/firestore';
import IngredientDetails from '@/components/IngredientDetails';
import Modal from '@/components/Modal';
import IngredientForm from '@/components/IngredientForm';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import ErrorMessage from '@/src/components/ErrorMessage';
import { Ingredient } from '@/types';
import { useRouter } from 'expo-router';

export default function Ingredients() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string | null>(null);
  const router = useRouter();

  const { data: ingredients, loading, error } = useIngredients({
    orderBy: ['category', 'asc']
  });

  const filteredIngredients = ingredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ingredient.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get the current ingredient object from the updated list
  const selectedIngredient = selectedIngredientId
    ? ingredients.find(i => i.id === selectedIngredientId) || null
    : null;

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message="Error loading ingredients" />;
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
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for an ingredient..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsModalVisible(true)}>
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {filteredIngredients.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="error-outline" size={48} color="#665" />
            <Text style={styles.emptyStateText}>No ingredients found</Text>
          </View>
        ) : (
          filteredIngredients.map((ingredient) => (
            <TouchableOpacity
              key={ingredient.id}
              style={styles.ingredientCard}
              onPress={() => setSelectedIngredientId(ingredient.id)}>
              <View style={styles.ingredientHeader}>
                <View>
                  <Text style={styles.ingredientName}>{ingredient.name}</Text>
                  <Text style={styles.ingredientCategory}>{ingredient.category}</Text>
                </View>
                <View style={styles.priceContainer}>
                  <Icon name="attach-money" size={16} color="#007AFF" />
                  <Text style={styles.price}>{ingredient.price.toFixed(2)}</Text>
                  <Text style={styles.unit}>/ {ingredient.unit}</Text>
                </View>
              </View>
              <View style={styles.stockContainer}>
                <View style={styles.stockBar}>
                  <View
                    style={[
                      styles.stockLevel,
                      {
                        width: `${Math.min((ingredient.stock / 100) * 100, 100)}%`,
                        backgroundColor: ingredient.stock < 1 ? '#FF3B30' : '#4CAF50'
                      }
                    ]}
                  />
                </View>
                <Text style={[
                  styles.stockText,
                  ingredient.stock < 20 && styles.stockWarning
                ]}>
                  Stock: {ingredient.stock} {ingredient.unit}
                  {ingredient.stock < 20 && ' (Low)'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={isModalVisible}>
        <IngredientForm
          onClose={() => setIsModalVisible(false)}
          onSubmit={async (values) => {
            try {
              await addIngredient(values);
              setIsModalVisible(false);
            } catch (error) {
              console.error('Error adding ingredient:', error);
            }
          }}
        />
      </Modal>
      <Modal visible={!!selectedIngredient}>
        {selectedIngredient && (
          <IngredientDetails
            ingredient={selectedIngredient}
            onClose={() => setSelectedIngredientId(null)}
          />
        )}
      </Modal>
    </View>
  );
};

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
  ingredientCard: {
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
  ingredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  ingredientName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  ingredientCategory: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  price: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 4,
  },
  unit: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666',
    marginLeft: 2,
  },
  stockContainer: {
    gap: 8,
  },
  stockBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  stockLevel: {
    height: '100%',
    borderRadius: 3,
  },
  stockText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666',
  },
  stockWarning: {
    color: '#FF3B30',
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
