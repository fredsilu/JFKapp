import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, Alert } from 'react-native';
//import Icon from 'react-native-vector-icons/MaterialIcons';
import { MaterialIcons as Icon } from '@expo/vector-icons';

import { Ingredient, DishIngredient, Dish } from '@/types';
import ErrorMessage from '@/src/components/ErrorMessage';

interface DishFormProps {
  dish?: Dish;
  ingredients: Ingredient[];
  onClose: () => void;
  onSubmit: (values: Omit<Dish, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export default function DishForm({ dish, ingredients, onClose, onSubmit }: DishFormProps) {
  const [name, setName] = useState(dish?.name || '');
  const [description, setDescription] = useState(dish?.description || '');
  const [image, setImage] = useState(dish?.image || '');
  const [preparationTime, setPreparationTime] = useState((dish?.preparationTime || '').toString());
  const [servings, setServings] = useState((dish?.servings || '').toString());
  const [selectedIngredients, setSelectedIngredients] = useState<DishIngredient[]>(
    dish?.ingredients || []
  );
  const [error, setError] = useState<string | null>(null);

  const handlePickImage = async () => {
    // For web using Expo
    if (Platform.OS === 'web') {
      const input = document.createElement('input') as HTMLInputElement;
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            setImage(result);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      // For mobile (would need expo-image-picker library)
      Alert.alert('Image Upload', 'Please use the URL field or take a photo to get a URL');
    }
  };

  const handleAddIngredient = (ingredient: Ingredient) => {
    if (!selectedIngredients.some(i => i.ingredient && i.ingredient.id === ingredient.id)) {
      setSelectedIngredients([...selectedIngredients, { ingredient, quantity: 0 }]);
    }
  };

  const handleUpdateQuantity = (ingredientId: string, quantity: string) => {
    setSelectedIngredients(prev => 
      prev.map(item => 
        item.ingredient && item.ingredient.id === ingredientId 
          ? { ...item, quantity: parseFloat(quantity) || 0 }
          : item
      )
    );
  };

  const handleRemoveIngredient = (ingredientId: string) => {
    setSelectedIngredients(prev => prev.filter(item => item.ingredient && item.ingredient.id !== ingredientId));
  };

  const calculateTotalPrice = () => {
    if (!selectedIngredients || selectedIngredients.length === 0) {
      return 0;
    }
    return selectedIngredients.reduce((total, { ingredient, quantity }) => {
      if (!ingredient || !ingredient.price) {
        return total;
      }
      return total + (ingredient.price * quantity);
    }, 0);
  };

  const validateForm = () => {
    if (!name.trim()) {
      setError('Le nom du plat est requis');
      return false;
    }

    if (image.trim()) {
      try {
        new URL(image);
      } catch {
        setError('URL de l\'image invalide');
        return false;
      }
    }

    const prepTime = parseInt(preparationTime, 10);
    if (isNaN(prepTime) || prepTime <= 0) {
      setError('Le temps de préparation doit être un nombre positif');
      return false;
    }

    const servingsNum = parseInt(servings, 10);
    if (isNaN(servingsNum) || servingsNum <= 0) {
      setError('Le nombre de portions doit être un nombre positif');
      return false;
    }

    if (selectedIngredients.length === 0) {
      setError('Au moins un ingrédient est requis');
      return false;
    }

    const invalidIngredient = selectedIngredients.find(({ quantity }) => quantity <= 0);
    if (invalidIngredient) {
      setError(`Quantité invalide pour ${invalidIngredient.ingredient.name}`);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const values = {
      name,
      description: description.trim() || '',
      image: image.trim() || '',
      ingredients: selectedIngredients,
      preparationTime: parseInt(preparationTime, 10),
      servings: parseInt(servings, 10),
    };

    try {
      onSubmit(values);
      onClose();
    } catch (err) {
      setError('Erreur lors de la sauvegarde du plat');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {dish ? 'Modifier le plat' : 'Nouveau plat'}
        </Text>
        <TouchableOpacity onPress={onClose}>
          <Icon name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {error && (
          <View style={styles.errorContainer}>
            <ErrorMessage message={error} />
          </View>
        )}

        <TouchableOpacity 
          style={styles.imagePreview}
          onPress={handlePickImage}>
          {image ? (
            <View style={styles.imagePreviewWithButton}>
              <Image source={{ uri: image }} style={styles.previewImage} />
              <View style={styles.changeImageButton}>
                <Icon name="photo-camera" size={20} color="#fff" />
              </View>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Icon name="image" size={48} color="#667" />
              <Text style={styles.placeholderText}>Ajouter une image (optionnel)</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nom du plat *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Spaghetti Carbonara"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description (optionnel)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Description du plat"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>URL de l&apos;image (optionnel)</Text>
            <TextInput
              style={styles.input}
              value={image}
              onChangeText={setImage}
              placeholder="https://..."
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={styles.label}>Temps de préparation (min) *</Text>
              <TextInput
                style={styles.input}
                value={preparationTime}
                onChangeText={setPreparationTime}
                keyboardType="numeric"
                placeholder="15"
              />
            </View>

            <View style={[styles.inputContainer, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>Portions *</Text>
              <TextInput
                style={styles.input}
                value={servings}
                onChangeText={setServings}
                keyboardType="numeric"
                placeholder="2"
              />
            </View>
          </View>

          <View style={styles.ingredientsSection}>
            <Text style={styles.sectionTitle}>Ingrédients *</Text>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.ingredientsList}
              contentContainerStyle={styles.ingredientsListContent}>
              {ingredients && Array.isArray(ingredients) && ingredients.map(ingredient => {
                if (!ingredient || !ingredient.id) return null;
                return (
                  <TouchableOpacity
                    key={ingredient.id}
                    style={[
                      styles.ingredientChip,
                      selectedIngredients.some(i => i.ingredient && i.ingredient.id === ingredient.id) && 
                      styles.ingredientChipSelected
                    ]}
                    onPress={() => handleAddIngredient(ingredient)}>
                    <Text style={[
                      styles.ingredientChipText,
                      selectedIngredients.some(i => i.ingredient && i.ingredient.id === ingredient.id) && 
                      styles.ingredientChipTextSelected
                    ]}>
                      {ingredient.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {selectedIngredients && Array.isArray(selectedIngredients) && selectedIngredients.map(({ ingredient, quantity }) => {
              if (!ingredient || !ingredient.id) return null;
              return (
                <View key={ingredient.id} style={styles.selectedIngredient}>
                  <View style={styles.selectedIngredientInfo}>
                    <Text style={styles.selectedIngredientName}>{ingredient.name}</Text>
                    <Text style={styles.selectedIngredientPrice}>
                      ${((ingredient.price || 0) * (quantity || 0)).toFixed(2)}
                    </Text>
                  </View>
                  
                  <View style={styles.quantityContainer}>
                    <TextInput
                      style={styles.quantityInput}
                      value={quantity.toString()}
                      onChangeText={(value) => handleUpdateQuantity(ingredient.id, value)}
                      keyboardType="decimal-pad"
                      placeholder="0"
                    />
                    <Text style={styles.unitText}>{ingredient.unit}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveIngredient(ingredient.id)}>
                    <Icon name="close" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              );
            })}

            {selectedIngredients.length > 0 && (
              <View style={styles.totalPrice}>
                <Text style={styles.totalPriceLabel}>Coût total des ingrédients :</Text>
                <Text style={styles.totalPriceValue}>${calculateTotalPrice().toFixed(2)}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={onClose}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>
            {dish ? 'Modifier le plat' : 'Créer le plat'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  errorContainer: {
    marginBottom: 16,
  },
  imagePreview: {
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePreviewWithButton: {
    position: 'relative',
    width: 120,
    height: 120,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  changeImageButton: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  ingredientsSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ingredientsList: {
    marginBottom: 16,
  },
  ingredientsListContent: {
    flexDirection: 'row',
    gap: 8,
  },
  ingredientChip: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 16,
  },
  ingredientChipSelected: {
    backgroundColor: '#ddd',
  },
  ingredientChipText: {
    fontSize: 14,
  },
  ingredientChipTextSelected: {
    fontWeight: 'bold',
  },
  selectedIngredient: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedIngredientInfo: {
    flex: 1,
  },
  selectedIngredientName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  selectedIngredientPrice: {
    fontSize: 12,
    color: '#666',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityInput: {
    width: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 4,
    textAlign: 'center',
  },
  unitText: {
    marginLeft: 8,
    fontSize: 14,
  },
  removeButton: {
    marginLeft: 8,
  },
  totalPrice: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalPriceLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  totalPriceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  cancelButton: {
    padding: 12,
    backgroundColor: '#ddd',
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  submitButton: {
    padding: 12,
    backgroundColor: '#007BFF',
    borderRadius: 8,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
});
