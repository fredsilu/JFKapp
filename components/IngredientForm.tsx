import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { X, DollarSign as Dollar, ChevronDown } from 'lucide-react-native';
import { addIngredient } from '@/src/services/firestore';
import ErrorMessage from '@/src/components/ErrorMessage';

const CATEGORIES = [
  'VIANDES',
  'BOISSONS',
  'EPICERIE',
  'LEGUMES',
  'PRODUITS LAITIERS',
  'EPICES',
  'CEREALES'
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
  onClose: () => void;
}

export default function IngredientForm({ onClose }: IngredientFormProps) {
  const [formData, setFormData] = useState<IngredientFormData>(initialFormData);
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
        <Text style={styles.title}>New Ingredient</Text>
        <TouchableOpacity 
          onPress={() => {
            setFormData(initialFormData);
            setFormError(null);
            onClose();
          }}>
          <X size={24} color="#666" />
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
                <Dollar size={16} color="#666" />
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
              <ChevronDown size={20} color="#666" />
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
          <Text style={styles.submitButtonText}>Add Ingredient</Text>
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
  form: {
    gap: 20,
  },
  formField: {
    gap: 8,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
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
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  priceTextInput: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingLeft: 8,
    paddingVertical: 12,
    paddingRight: 12,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
  },
  categoryText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#1a1a1a',
  },
  categoryPlaceholder: {
    color: '#666',
  },
  categoriesList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryOptionSelected: {
    backgroundColor: '#007AFF15',
  },
  categoryOptionText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#1a1a1a',
  },
  categoryOptionTextSelected: {
    color: '#007AFF',
    fontFamily: 'Inter_500Medium',
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