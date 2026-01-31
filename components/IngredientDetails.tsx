import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Ingredient } from '@/types';
import { updateIngredient } from '@/src/services/firestore';
import IngredientForm from '@/components/IngredientForm';
import Modal from '@/components/Modal';
import { formatCurrency } from '@/src/utils/costs';

interface IngredientDetailsProps {
  ingredient: Ingredient;
  onClose: () => void;
}

export default function IngredientDetails({ ingredient, onClose }: IngredientDetailsProps) {
  const [showEditForm, setShowEditForm] = useState(false);

  const getStockStatus = () => {
    if (ingredient.stock <= 10) return 'critical';
    if (ingredient.stock <= 20) return 'low';
    if (ingredient.stock >= 80) return 'good';
    return 'normal';
  };

  const getStockColor = () => {
    switch (getStockStatus()) {
      case 'critical':
        return '#FF3B30';
      case 'low':
        return '#FF9500';
      case 'good':
        return '#34C759';
      default:
        return '#007AFF';
    }
  };

  const getStockMessage = () => {
    switch (getStockStatus()) {
      case 'critical':
        return 'Stock critique';
      case 'low':
        return 'Stock bas';
      case 'good':
        return 'Stock optimal';
      default:
        return 'Stock normal';
    }
  };

  const handleUpdateIngredient = async (updatedIngredient: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await updateIngredient(ingredient.id, updatedIngredient);
      setShowEditForm(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'ingrédient:', error);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Détails de l'ingrédient</Text>
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
          <View style={styles.mainInfo}>
            <View style={styles.nameSection}>
              <Text style={styles.name}>{ingredient.name}</Text>
              <View style={[styles.categoryBadge, { backgroundColor: '#007AFF15' }]}>
                <Text style={styles.categoryText}>{ingredient.category}</Text>
              </View>
            </View>

            <View style={styles.priceCard}>
              <View style={styles.priceHeader}>
                
                <Text style={styles.priceLabel}>Coût unitaire</Text>
              </View>
             <View style={styles.priceContent}>
  <Text style={styles.priceValue}>
    {formatCurrency(ingredient.price)} / {ingredient.unit}
  </Text>
</View>

            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="inventory" size={20} color="#1a1a1a" />
              <Text style={styles.sectionTitle}>État du stock</Text>
            </View>

            <View style={styles.stockCard}>
              <View style={styles.stockInfo}>
                <Text style={styles.stockValue}>{ingredient.stock}</Text>
                <Text style={styles.stockUnit}>{ingredient.unit}</Text>
              </View>

              <View style={styles.stockBarContainer}>
                <View style={styles.stockBar}>
                  <View
                    style={[
                      styles.stockLevel,
                      {
                        width: `${Math.min((ingredient.stock / 100) * 100, 100)}%`,
                        backgroundColor: getStockColor()
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.stockStatus, { color: getStockColor() }]}>
                  {getStockMessage()}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="history" size={20} color="#1a1a1a" />
              <Text style={styles.sectionTitle}>Mouvements de stock</Text>
            </View>

            <View style={styles.movementsContainer}>
              <View style={styles.movement}>
                <View style={[styles.movementIcon, { backgroundColor: '#34C75915' }]}>
                  <MaterialIcons name="arrow-downward" size={20} color="#34C759" />
                </View>
                <View style={styles.movementInfo}>
                  <Text style={styles.movementTitle}>Dernière entrée</Text>
                  <Text style={styles.movementMeta}>20 {ingredient.unit} • 15/02/2024</Text>
                </View>
              </View>

              <View style={styles.movement}>
                <View style={[styles.movementIcon, { backgroundColor: '#FF3B3015' }]}>
                  <MaterialIcons name="arrow-upward" size={20} color="#FF3B30" />
                </View>
                <View style={styles.movementInfo}>
                  <Text style={styles.movementTitle}>Dernière sortie</Text>
                  <Text style={styles.movementMeta}>5 {ingredient.unit} • 14/02/2024</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Statistiques d'utilisation</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>45</Text>
                <Text style={styles.statLabel}>Plats utilisant cet ingrédient</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>128</Text>
                <Text style={styles.statLabel}>Utilisations ce mois</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>12.5</Text>
                <Text style={styles.statLabel}>Moyenne mensuelle ({ingredient.unit})</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      <Modal visible={showEditForm}>
        <IngredientForm
          ingredient={ingredient}
          onClose={() => setShowEditForm(false)}
          onSubmit={handleUpdateIngredient}
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
  content: {
    flex: 1,
  },
  mainInfo: {
    padding: 20,
    gap: 20,
  },
  nameSection: {
    gap: 12,
  },
  name: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#1a1a1a',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#007AFF',
  },
  priceCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  priceLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#1a1a1a',
  },
  priceContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    color: '#007AFF',
  },
  priceUnit: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#666',
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
  stockCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  stockValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    color: '#1a1a1a',
  },
  stockUnit: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#666',
  },
  stockBarContainer: {
    gap: 8,
  },
  stockBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  stockLevel: {
    height: '100%',
    borderRadius: 4,
  },
  stockStatus: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  movementsContainer: {
    gap: 12,
  },
  movement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
  },
  movementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  movementInfo: {
    flex: 1,
  },
  movementTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  movementMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666',
  },
  statsGrid: {
    gap: 12,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
  },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666',
  },
});
