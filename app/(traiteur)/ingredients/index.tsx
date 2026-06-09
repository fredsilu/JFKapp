// app/(traiteur)/ingredients/index.tsx
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useWebModalBack } from '@/src/hooks/useWebModalBack';
import { useIngredients } from '@/src/hooks/useFirestore';
import { addIngredient } from '@/src/services/firestore';
import IngredientDetails from '@/components/IngredientDetails';
import Modal from '@/components/Modal';
import IngredientForm from '@/components/IngredientForm';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import ErrorMessage from '@/src/components/ErrorMessage';

export default function Ingredients() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string | null>(null);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (selectedIngredientId) {
          setSelectedIngredientId(null);
          return true;
        }

        if (isModalVisible) {
          setIsModalVisible(false);
          return true;
        }

        router.replace('/(traiteur)/config');
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => subscription.remove();
    }, [selectedIngredientId, isModalVisible, router])
  );


  const {
    data: ingredients = [],
    loading,
    error,
  } = useIngredients({
    orderBy: ['category', 'asc'],
  });

  const normalizedSearch = searchQuery.trim().toLowerCase();



  const filteredIngredients = useMemo(() => {
    if (!normalizedSearch) return ingredients;

    return ingredients.filter((ingredient) => {
      const name = ingredient.name ?? '';
      const category = ingredient.category ?? '';

      return (
        name.toLowerCase().includes(normalizedSearch) ||
        category.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [ingredients, normalizedSearch]);

  const selectedIngredient = selectedIngredientId
    ? ingredients.find((ingredient) => ingredient.id === selectedIngredientId) ?? null
    : null;

  const closeIngredientModal = useCallback(() => {
    setSelectedIngredientId(null);
  }, []);

  const closeFormModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  useWebModalBack({
    visible: !!selectedIngredientId,
    onClose: closeIngredientModal,
  });

  useWebModalBack({
    visible: isModalVisible,
    onClose: closeFormModal,
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message="Erreur lors du chargement des ingrédients" />;
  }


  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => router.replace('/(traiteur)/config')}
        style={styles.backPill}
        activeOpacity={0.75}
      >
        <Icon name="arrow-back" size={18} color="#0F4C81" />
        <Text style={styles.backPillText}>Configuration</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un ingrédient..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsModalVisible(true)}
          activeOpacity={0.8}
        >
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {filteredIngredients.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="error-outline" size={48} color="#666" />
            <Text style={styles.emptyStateText}>Aucun ingrédient trouvé</Text>
          </View>
        ) : (
          filteredIngredients.map((ingredient) => {
            const stock = ingredient.stock ?? 0;
            const price = ingredient.price ?? 0;
            const unit = ingredient.unit ?? '';
            const stockPercentage = Math.min(Math.max(stock, 0), 100);
            const isLowStock = stock < 20;

            return (
              <TouchableOpacity
                key={ingredient.id}
                style={styles.ingredientCard}
                onPress={() => setSelectedIngredientId(ingredient.id)}
                activeOpacity={0.8}
              >
                <View style={styles.ingredientHeader}>
                  <View style={styles.ingredientInfo}>
                    <Text style={styles.ingredientName}>
                      {ingredient.name ?? 'Ingrédient sans nom'}
                    </Text>
                    <Text style={styles.ingredientCategory}>
                      {ingredient.category ?? 'Non catégorisé'}
                    </Text>
                  </View>

                  <View style={styles.priceContainer}>
                    <Icon name="attach-money" size={16} color="#007AFF" />
                    <Text style={styles.price}>{price.toFixed(2)}</Text>
                    {!!unit && <Text style={styles.unit}>/ {unit}</Text>}
                  </View>
                </View>

                <View style={styles.stockContainer}>
                  <View style={styles.stockBar}>
                    <View
                      style={[
                        styles.stockLevel,
                        {
                          width: `${stockPercentage}%`,
                          backgroundColor: stock < 1 ? '#FF3B30' : '#4CAF50',
                        },
                      ]}
                    />
                  </View>

                  <Text style={[styles.stockText, isLowStock && styles.stockWarning]}>
                    Stock : {stock} {unit}
                    {isLowStock && ' (Faible)'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    marginTop: 40,
  },
  backPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 12,
    marginLeft: 20,
  },
  backPillText: {
    color: '#0F4C81',
    fontSize: 14,
    fontWeight: '700',
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
    gap: 12,
  },
  ingredientInfo: {
    flex: 1,
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
});