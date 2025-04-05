import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { addIngredient } from '@/src/services/firestore';
import ErrorMessage from '@/src/components/ErrorMessage';
import { Ingredient } from '@/types';

const CATEGORIES = [
  'BOISSON',
  'CHARCUTERIE',
  'CONDIMENT',
  'EPICERIE',
  'FRUIT',
  'LEGUME',
  'NON ALIMENTAIRE',
  'POISSON', 
  'PRODUIT LAITIER',
  'VIANDE',
] as const;

type Category = typeof CATEGORIES[number];

interface IngredientFormData {
  name: string;
  price: string;
  unit: string;
  stock: string;
  category: Category | '';
}

const initialFormData: IngredientFormData = {
  name: '',
  price: '',
  unit: '',
  stock: '',
  category: '',
};

interface IngredientFormProps {
  ingredient?: Ingredient;
  onClose: () => void;
  onSubmit: (values: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export default function IngredientForm({ ingredient, onClose }: IngredientFormProps) {
  const [formData, setFormData] = useState<IngredientFormData>({
    name: ingredient?.name || '',
    price: ingredient?.price.toString() || '',
    unit: ingredient?.unit || '',
    stock: ingredient?.stock.toString() || '',
    category: ingredient?.category as Category || '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [showCategories, setShowCategories] = useState(false);

  const handleSubmit = async () => {
    try {
      setFormError(null);
      
      // Validate form data
      if (!formData.name || !formData.price || !formData.unit || !formData.stock || !formData.category) {
        setFormError('All fields are required');
        return;
      }

      const price = parseFloat(formData.price);
      const stock = parseFloat(formData.stock);

      if (isNaN(price) || price <= 0) {
        setFormError('Price must be a positive number');
        return;
      }

      if (isNaN(stock) || stock < 0) {
        setFormError('Stock must be a positive number');
        return;
      }

      await addIngredient({
        name: formData.name,
        price,
        unit: formData.unit,
        stock,
        category: formData.category,
        quantity: 0, // or any default value
        description: '', // or any default value
      });

      setFormData(initialFormData);
      onClose();
    } catch (err) {
      setFormError('An error occurred while adding the ingredient');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {ingredient ? 'Modifier l\'ingrédient' : 'Nouvel ingrédient'}
        </Text>
        <TouchableOpacity 
          onPress={() => {
            setFormData(initialFormData);
            setFormError(null);
            onClose();
          }}>
          <MaterialIcons name="close" size={24} color="#665" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {formError && (
          <View style={styles.errorContainer}>
            <ErrorMessage message={formError} />
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.formField}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Ex: All-purpose flour"
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formField, { flex: 1 }]}>
              <Text style={styles.label}>Price</Text>
              <View style={styles.priceInput}>
                <MaterialIcons name="attach-money" size={16} color="#665" />
                <TextInput
                  style={[styles.input, styles.priceTextInput]}
                  value={formData.price}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={[styles.formField, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>Unit</Text>
              <TextInput
                style={styles.input}
                value={formData.unit}
                onChangeText={(text) => setFormData(prev => ({ ...prev, unit: text }))}
                placeholder="kg, L, piece"
              />
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity
              style={styles.categorySelector}
              onPress={() => setShowCategories(!showCategories)}>
              <Text style={[
                styles.categoryText,
                !formData.category && styles.categoryPlaceholder
              ]}>
                {formData.category || 'Select a category'}
              </Text>
              <MaterialIcons name="expand-more" size={20} color="#665" />
            </TouchableOpacity>
            {showCategories && (
              <View style={styles.categoriesList}>
                {CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryOption,
                      formData.category === category && styles.categoryOptionSelected
                    ]}
                    onPress={() => {
                      setFormData(prev => ({ ...prev, category }));
                      setShowCategories(false);
                    }}>
                    <Text style={[
                      styles.categoryOptionText,
                      formData.category === category && styles.categoryOptionTextSelected
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Initial Stock</Text>
            <TextInput
              style={styles.input}
              value={formData.stock}
              onChangeText={(text) => setFormData(prev => ({ ...prev, stock: text }))}
              placeholder="0"
              keyboardType="decimal-pad"
            />
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
          <Text style={styles.submitButtonText}>
            {ingredient ? 'Modifier' : 'Ajouter'}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  errorContainer: {
    marginBottom: 16,
  },
  form: {
    marginBottom: 16,
  },
  formField: {
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
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
  },
  formRow: {
    flexDirection: 'row',
  },
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
  },
  priceTextInput: {
    flex: 1,
    marginLeft: 4,
  },
  categorySelector: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 14,
  },
  categoryPlaceholder: {
    color: '#aaa',
  },
  categoriesList: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  categoryOption: {
    padding: 8,
  },
  categoryOptionSelected: {
    backgroundColor: '#f0f0f0',
  },
  categoryOptionText: {
    fontSize: 14,
  },
  categoryOptionTextSelected: {
    fontWeight: 'bold',
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
    borderRadius: 4,
    backgroundColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#333',
  },
  submitButton: {
    padding: 12,
    borderRadius: 4,
    backgroundColor: '#007BFF',
  },
  submitButtonText: {
    fontSize: 14,
    color: '#fff',
  },
});
