import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { X, Plus, Image as ImageIcon, DollarSign as Dollar } from 'lucide-react-native';
import { Ingredient, DishIngredient } from '@/types';
import ErrorMessage from '@/src/components/ErrorMessage';

interface DishFormProps {
  ingredients: Ingredient[];
  onClose: () => void;
  onSubmit: (values: {
    name: string;
    description?: string;
    image?: string;
    ingredients: DishIngredient[];
    preparationTime: number;
    servings: number;
  }) => void;
}

export default function DishForm({ ingredients, onClose, onSubmit }: DishFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [preparationTime, setPreparationTime] = useState('');
  const [servings, setServings] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState<DishIngredient[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleAddIngredient = (ingredient: Ingredient) => {
    if (!selectedIngredients.some(i => i.ingredient.id === ingredient.id)) {
      setSelectedIngredients([...selectedIngredients, { ingredient, quantity: 0 }]);
    }
  };

  const handleUpdateQuantity = (ingredientId: string, quantity: string) => {
    setSelectedIngredients(prev => 
      prev.map(item => 
        item.ingredient.id === ingredientId 
          ? { ...item, quantity: parseFloat(quantity) || 0 }
          : item
      )
    );
  };

  const handleRemoveIngredient = (ingredientId: string) => {
    setSelectedIngredients(prev => prev.filter(item => item.ingredient.id !== ingredientId));
  };

  const calculateTotalPrice = () => {
    return selectedIngredients.reduce((total, { ingredient, quantity }) => {
      return total + (ingredient.price * quantity);
    }, 0);
  };

  const validateForm = () => {
    if (!name.trim()) {
      setError('Dish name is required');
      return false;
    }

    // Image URL validation only if provided
    if (image.trim()) {
      try {
        new URL(image);
      } catch {
        setError('Invalid image URL');
        return false;
      }
    }

    const prepTime = parseInt(preparationTime, 10);
    if (isNaN(prepTime) || prepTime <= 0) {
      setError('Preparation time must be a positive number');
      return false;
    }

    const servingsNum = parseInt(servings, 10);
    if (isNaN(servingsNum) || servingsNum <= 0) {
      setError('Number of servings must be a positive number');
      return false;
    }

    if (selectedIngredients.length === 0) {
      setError('At least one ingredient is required');
      return false;
    }

    const invalidIngredient = selectedIngredients.find(({ quantity }) => quantity <= 0);
    if (invalidIngredient) {
      setError(`Invalid quantity for ${invalidIngredient.ingredient.name}`);
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    setError(null);

    if (!validateForm()) {
      return;
    }

    onSubmit({
      name,
      description: description.trim() || undefined,
      image: image.trim() || undefined,
      ingredients: selectedIngredients,
      preparationTime: parseInt(preparationTime, 10),
      servings: parseInt(servings, 10),
    });
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>New Dish</Text>
        <TouchableOpacity onPress={onClose}>
          <X size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {error && (
          <View style={styles.errorContainer}>
            <ErrorMessage message={error} />
          </View>
        )}

        <View style={styles.imagePreview}>
          {image ? (
            <Image source={{ uri: image }} style={styles.previewImage} />
          ) : (
            <View style={styles.placeholderContainer}>
              <ImageIcon size={48} color="#666" />
              <Text style={styles.placeholderText}>Add an image (optional)</Text>
            </View>
          )}
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Dish Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Spaghetti Carbonara"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the dish"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Image URL (optional)</Text>
            <TextInput
              style={styles.input}
              value={image}
              onChangeText={setImage}
              placeholder="https://..."
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={styles.label}>Preparation Time (min) *</Text>
              <TextInput
                style={styles.input}
                value={preparationTime}
                onChangeText={setPreparationTime}
                keyboardType="numeric"
                placeholder="15"
              />
            </View>

            <View style={[styles.inputContainer, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>Servings *</Text>
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
            <Text style={styles.sectionTitle}>Ingredients *</Text>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.ingredientsList}
              contentContainerStyle={styles.ingredientsListContent}>
              {ingredients.map(ingredient => (
                <TouchableOpacity
                  key={ingredient.id}
                  style={[
                    styles.ingredientChip,
                    selectedIngredients.some(i => i.ingredient.id === ingredient.id) && 
                    styles.ingredientChipSelected
                  ]}
                  onPress={() => handleAddIngredient(ingredient)}>
                  <Text style={[
                    styles.ingredientChipText,
                    selectedIngredients.some(i => i.ingredient.id === ingredient.id) && 
                    styles.ingredientChipTextSelected
                  ]}>
                    {ingredient.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedIngredients.map(({ ingredient, quantity }) => (
              <View key={ingredient.id} style={styles.selectedIngredient}>
                <View style={styles.selectedIngredientInfo}>
                  <Text style={styles.selectedIngredientName}>{ingredient.name}</Text>
                  <Text style={styles.selectedIngredientPrice}>
                    ${(ingredient.price * (quantity || 0)).toFixed(2)}
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
                  <X size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}

            {selectedIngredients.length > 0 && (
              <View style={styles.totalPrice}>
                <Text style={styles.totalPriceLabel}>Total ingredients cost:</Text>
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
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Create Dish</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  errorContainer: {
    marginBottom: 20,
  },
  imagePreview: {
    height: 200,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderContainer: {
    alignItems: 'center',
    gap: 8,
  },
  placeholderText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666',
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#1a1a1a',
  },
  input: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    color: '#1a1a1a',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  ingredientsSection: {
    gap: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1a1a1a',
  },
  ingredientsList: {
    marginBottom: 8,
  },
  ingredientsListContent: {
    paddingRight: 20,
  },
  ingredientChip: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  ingredientChipSelected: {
    backgroundColor: '#007AFF15',
  },
  ingredientChipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#666',
  },
  ingredientChipTextSelected: {
    color: '#007AFF',
  },
  selectedIngredient: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  selectedIngredientInfo: {
    flex: 1,
  },
  selectedIngredientName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 2,
  },
  selectedIngredientPrice: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#666',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  quantityInput: {
    fontFamily: 'Inter_400Regular',
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 8,
    width: 60,
    marginRight: 8,
    textAlign: 'center',
  },
  unitText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666',
  },
  removeButton: {
    padding: 4,
  },
  totalPrice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalPriceLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#1a1a1a',
  },
  totalPriceValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#007AFF',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
    backgroundColor: '#fff',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#666',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },
});