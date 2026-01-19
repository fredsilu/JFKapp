import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
//import Icon from 'react-native-vector-icons/MaterialIcons';
import { MaterialIcons as Icon } from '@expo/vector-icons';

import { useClients, useDishes } from '@/src/hooks/useFirestore';
import { Order, Client, Dish, OrderDish, OrderIngredient, Ingredient } from '@/types';
import { calculateOrderTotalCost, formatCurrency } from '@/src/utils/costs';
import ErrorMessage from '@/src/components/ErrorMessage';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import { useIngredients } from '@/src/hooks/useFirestore';
import { OrderFormProps } from '@/types';

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
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  ingredientsScroll: {
    marginBottom: 16,
  },
  ingredientsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  ingredientCard: {
    width: 120,
    padding: 8,
    margin: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  ingredientCardContent: {
    alignItems: 'center',
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ingredientCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  ingredientPrice: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 12,
    color: '#007AFF',
  },
  errorContainer: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  selectedClient: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  clientImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  clientMeta: {
    fontSize: 14,
    color: '#666',
  },
  changeButton: {
    padding: 8,
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  changeButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  searchSection: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    padding: 8,
  },
  searchResults: {
    maxHeight: 200,
  },
  clientResult: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  resultImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  resultMeta: {
    fontSize: 12,
    color: '#666',
  },
  dishesScroll: {
    marginBottom: 16,
  },
  dishesContainer: {
    flexDirection: 'row',
  },
  dishCard: {
    width: 120,
    marginRight: 16,
  },
  dishImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
  },
  dishInfo: {
    marginTop: 8,
  },
  dishName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  dishMeta: {
    fontSize: 12,
    color: '#666',
  },
  selectedDishes: {
    marginTop: 16,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  selectedDishItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedDishImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 8,
  },
  selectedDishInfo: {
    flex: 1,
  },
  selectedDishName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  quantityButtonText: {
    fontSize: 16,
  },
  quantityText: {
    marginHorizontal: 8,
    fontSize: 14,
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
    borderRadius: 4,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#333',
  },
  submitButton: {
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  submitButtonText: {
    fontSize: 14,
    color: '#fff',
  },
  selectedIngredients: {
    marginTop: 16,
  },
  selectedIngredientItem: {
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
  selectedIngredientCategory: {
    fontSize: 12,
    color: '#666',
  },
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 4,
    width: 40,
    textAlign: 'center',
  },
  unitText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  removeButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  formField: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  input: {
    flex: 1,
    padding: 8,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  totalSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  totalAmount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});

export default function OrderForm({ order, onClose, onSubmit }: OrderFormProps) {
  // États pour le formulaire
  const [selectedClient, setSelectedClient] = useState<Client | null>(order?.client || null);
  const [selectedDishes, setSelectedDishes] = useState<OrderDish[]>(order?.dishes || []);
  const [additionalIngredients, setAdditionalIngredients] = useState<OrderIngredient[]>(
    order?.additionalIngredients || []
  );
  const [deliveryDate, setDeliveryDate] = useState(order?.deliveryDate || '');
  const [deliveryTime, setDeliveryTime] = useState(order?.deliveryTime || '');
  const [address, setAddress] = useState(order?.address || '');
  const [formError, setFormError] = useState<string | null>(null);

  // États pour la recherche
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [dishSearchQuery, setDishSearchQuery] = useState('');
  const [showClientSearch, setShowClientSearch] = useState(!order);
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState('');

  // Récupération des données
  const { data: clients = [], loading: loadingClients } = useClients();
  const { data: dishes = [], loading: loadingDishes } = useDishes();
  const { data: ingredients = [], loading: loadingIngredients } = useIngredients();

  // Filtrage des clients et plats
  const filteredClients = clients.filter(client =>
    (client.name && client.name.toLowerCase().includes(clientSearchQuery.toLowerCase())) ||
    (client.email && client.email.toLowerCase().includes(clientSearchQuery.toLowerCase()))
  );

  const filteredDishes = dishes.filter(dish =>
    dish.name && dish.name.toLowerCase().includes(dishSearchQuery.toLowerCase())
  );
  const filteredIngredients = ingredients.filter(ingredient =>
    (ingredient.name && ingredient.name.toLowerCase().includes(ingredientSearchQuery.toLowerCase())) ||
    (ingredient.category && ingredient.category.toLowerCase().includes(ingredientSearchQuery.toLowerCase()))
  );

  const handleAddIngredient = (ingredient: Ingredient) => {
    // Vérifier si l'ingrédient existe déjà
    const existingIngredient = additionalIngredients.find(
      item => item.ingredient.id === ingredient.id
    );

    if (existingIngredient) {
      // Si l'ingrédient existe, augmenter sa quantité
      handleUpdateIngredientQuantity(ingredient.id, existingIngredient.quantity + 1);
    } else {
      // Sinon, ajouter le nouvel ingrédient avec une quantité de 1
      setAdditionalIngredients([
        ...additionalIngredients,
        { ingredient, quantity: 1 }
      ]);
    }
  };
  const handleUpdateIngredientQuantity = (ingredientId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveIngredient(ingredientId);
      return;
    }

    setAdditionalIngredients(prev =>
      prev.map(item =>
        item.ingredient.id === ingredientId
          ? { ...item, quantity }
          : item
      )
    );
  };
  const handleRemoveIngredient = (ingredientId: string) => {
    setAdditionalIngredients(prev =>
      prev.filter(item => item.ingredient.id !== ingredientId)
    );
  };

  const handleAddDish = (dish: Dish) => {
    const existingDish = selectedDishes.find(d => d.dish.id === dish.id);
    if (existingDish) {
      setSelectedDishes(prev =>
        prev.map(d =>
          d.dish.id === dish.id
            ? { ...d, quantity: d.quantity + 1 }
            : d
        )
      );
    } else {
      setSelectedDishes(prev => [...prev, { dish, quantity: 1, name: dish.name, ingredients: dish.ingredients, additionalIngredients: [] }]);
    }
  };

  const handleUpdateDishQuantity = (dishId: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedDishes(prev => prev.filter(d => d.dish.id !== dishId));
    } else {
      setSelectedDishes(prev =>
        prev.map(d =>
          d.dish.id === dishId
            ? { ...d, quantity }
            : d
        )
      );
    }
  };

  const validateForm = () => {
    if (!selectedClient) {
      setFormError('Veuillez sélectionner un client');
      return false;
    }

    if (selectedDishes.length === 0) {
      setFormError('Veuillez ajouter au moins un plat');
      return false;
    }

    if (!deliveryDate) {
      setFormError('Veuillez spécifier une date de livraison');
      return false;
    }

    if (!deliveryTime) {
      setFormError('Veuillez spécifier une heure de livraison');
      return false;
    }

    if (!address) {
      setFormError('Veuillez spécifier une adresse de livraison');
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    onSubmit({
      clientId: selectedClient!.id,
      client: selectedClient!,
      status: order?.status || 'En cours',
      dishes: selectedDishes,
      additionalIngredients,
      deliveryDate,
      deliveryTime,
      address,
      deliveryAddress: address,
      //createdAt: order?.createdAt || new Date().toISOString(),

    });
  };
  // const [loading, setLoading] = useState(true);

  if (loadingClients || loadingDishes || loadingIngredients) {
    return <LoadingSpinner />;
  }



  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.title}>
          {order ? 'Modifier la commande' : 'Nouvelle commande'}
        </Text>
        <TouchableOpacity onPress={onClose}>
          <Icon name="close" size={24} color="#665" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {formError && (
          <View style={styles.errorContainer}>
            <ErrorMessage message={formError} />
          </View>
        )}


        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client</Text>
          {selectedClient && !showClientSearch ? (
            <View style={styles.selectedClient}>

              <Image
                source={selectedClient.profilePicture
                  ? { uri: selectedClient.profilePicture }
                  : require('@/assets/images/no_client_picture_small.jpg')}
                style={styles.clientImage}
              />
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{selectedClient.name}</Text>
                <Text style={styles.clientMeta}>{selectedClient.email}</Text>
                <Text style={styles.clientMeta}>{selectedClient.phone}</Text>
              </View>
              {!order && (
                <TouchableOpacity
                  style={styles.changeButton}
                  onPress={() => setShowClientSearch(true)}>
                  <Text style={styles.changeButtonText}>Modifier</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.searchSection}>
              <View style={styles.searchContainer}>
                <Icon name="search" size={20} color="#665" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher un client..."
                  value={clientSearchQuery}
                  onChangeText={setClientSearchQuery}
                />
              </View>
              <ScrollView style={styles.searchResults}>
                {filteredClients.map(client => (
                  <TouchableOpacity
                    key={client.id}
                    style={styles.clientResult}
                    onPress={() => {
                      setSelectedClient(client);
                      setShowClientSearch(false);
                      setAddress(client.address);
                    }}>

                    <Image
                      source={client.profilePicture
                        ? { uri: client.profilePicture }
                        : require('@/assets/images/no_client_picture_small.jpg')}
                      style={styles.resultImage}
                    />
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultName}>{client.name}</Text>
                      <Text style={styles.resultMeta}>{client.email}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plats</Text>
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un plat..."
              value={dishSearchQuery}
              onChangeText={setDishSearchQuery}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dishesScroll}
            contentContainerStyle={styles.dishesContainer}>
            {filteredDishes.map(dish => (
              <TouchableOpacity
                key={dish.id}
                style={styles.dishCard}
                onPress={() => handleAddDish(dish)}>
                <Image
                  source={{ uri: dish.image }}
                  style={styles.dishImage}
                />
                <View style={styles.dishInfo}>
                  <Text style={styles.dishName}>{dish.name}</Text>
                  <Text style={styles.dishMeta}>
                    {dish.preparationTime} min • {dish.servings} portions
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {selectedDishes.length > 0 && (
            <View style={styles.selectedDishes}>
              <Text style={styles.subsectionTitle}>Plats sélectionnés</Text>
              {selectedDishes && Array.isArray(selectedDishes) && selectedDishes.map(({ dish, quantity }) => {
                if (!dish || !dish.id) return null;
                return (
                  <View key={dish.id} style={styles.selectedDishItem}>
                    <Image
                      source={{ uri: dish.image || 'https://via.placeholder.com/100' }}
                      style={styles.selectedDishImage}
                    />
                    <View style={styles.selectedDishInfo}>
                      <Text style={styles.selectedDishName}>{dish.name}</Text>
                      <View style={styles.quantityContainer}>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => handleUpdateDishQuantity(dish.id, quantity - 1)}>
                          <Text style={styles.quantityButtonText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.quantityText}>{quantity}</Text>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => handleUpdateDishQuantity(dish.id, quantity + 1)}>
                          <Text style={styles.quantityButtonText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingrédients supplémentaires</Text>
            <View style={styles.searchContainer}>
              <Icon name="search" size={20} color="#665" />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un ingrédient..."
                value={ingredientSearchQuery}
                onChangeText={setIngredientSearchQuery}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.ingredientsScroll}
              contentContainerStyle={styles.ingredientsContainer}>
              {filteredIngredients && Array.isArray(filteredIngredients) && filteredIngredients.map(ingredient => {
                if (!ingredient || !ingredient.id) return null;
                return (
                  <TouchableOpacity
                    key={ingredient.id}
                    style={styles.ingredientCard}
                    onPress={() => handleAddIngredient(ingredient)}>
                    <View style={styles.ingredientCardContent}>
                      <Text style={styles.ingredientName}>{ingredient.name}</Text>
                      <Text style={styles.ingredientCategory}>{ingredient.category}</Text>
                      <View style={styles.ingredientPrice}>
                        <Icon name="attach-money" size={14} color="#007AFF" />
                        <Text style={styles.priceText}>
                          {formatCurrency(ingredient.price || 0)} / {ingredient.unit}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {additionalIngredients.length > 0 && (
              <View style={styles.selectedIngredients}>
                <Text style={styles.subsectionTitle}>Ingrédients sélectionnés</Text>
                {additionalIngredients && Array.isArray(additionalIngredients) && additionalIngredients.map(({ ingredient, quantity }) => {
                  if (!ingredient || !ingredient.id) return null;
                  return (
                    <View key={ingredient.id} style={styles.selectedIngredientItem}>
                      <View style={styles.selectedIngredientInfo}>
                        <Text style={styles.selectedIngredientName}>{ingredient.name}</Text>
                        <Text style={styles.selectedIngredientCategory}>{ingredient.category}</Text>
                      </View>
                      <View style={styles.quantityContainer}>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => handleUpdateIngredientQuantity(ingredient.id, quantity - 1)}>
                          <Text style={styles.quantityButtonText}>-</Text>
                        </TouchableOpacity>
                        <View style={styles.quantityInputContainer}>
                          <TextInput
                            style={styles.quantityInput}
                            value={quantity.toString()}
                            onChangeText={(value) => handleUpdateIngredientQuantity(
                              ingredient.id,
                              parseFloat(value) || 0
                            )}
                            keyboardType="decimal-pad"
                          />
                          <Text style={styles.unitText}>{ingredient.unit}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => handleUpdateIngredientQuantity(ingredient.id, quantity + 1)}>
                          <Text style={styles.quantityButtonText}>+</Text>
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveIngredient(ingredient.id)}>
                        <Icon name="close" size={20} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Détails de livraison</Text>
            <View style={styles.formField}>
              <Text style={styles.label}>Date de livraison</Text>
              <View style={styles.inputContainer}>
                <Icon name="event" size={20} color="#665" />
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={deliveryDate}
                  onChangeText={setDeliveryDate}
                />
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.label}>Heure de livraison</Text>
              <View style={styles.inputContainer}>
                <Icon name="access-time" size={20} color="#665" />
                <TextInput
                  style={styles.input}
                  placeholder="14:30"
                  value={deliveryTime}
                  onChangeText={setDeliveryTime}
                />
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.label}>Adresse de livraison</Text>
              <View style={styles.inputContainer}>
                <Icon name="location-on" size={20} color="#665" />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Adresse complète"
                  value={address}
                  onChangeText={setAddress}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </View>

          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total de la commande</Text>
            <View style={styles.totalAmount}>
              <Icon name="attach-money" size={24} color="#007AFF" />
              <Text style={styles.totalValue}>
                {formatCurrency(calculateOrderTotalCost({
                  ...order,
                  dishes: selectedDishes,
                  additionalIngredients,
                } as Order))}
              </Text>
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
              {order ? 'Modifier la commande' : 'Créer la commande'}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
