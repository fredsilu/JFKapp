//components/OrderForm.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
//import Icon from 'react-native-vector-icons/MaterialIcons';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { Keyboard } from 'react-native';

import { useClients, useDishes } from '@/src/hooks/useFirestore';
import { Order, Client, Dish, OrderDish, OrderIngredient, Ingredient } from '@/types';
import { calculateOrderTotalCost, formatCurrency } from '@/src/utils/costs';
import ErrorMessage from '@/src/components/ErrorMessage';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import { useIngredients } from '@/src/hooks/useFirestore';
import { OrderFormProps } from '@/types';
import DateTimePicker from '@react-native-community/datetimepicker';

type EditableOrderItem = {
  id?: string;
  label: string;
  quantity: number;
  numberOfDays?: number;
  unitPrice?: number;
  total?: number;
  dish?: Dish;
};

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
  editableItemCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  editableItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },

  editableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  editableLabel: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '700',
  },

  editableInput: {
    width: 80,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    minHeight: 42,
    fontWeight: '700',
    fontSize: 15,
  },
});

export default function OrderForm({ order, onClose, onSubmit }: OrderFormProps) {
  // Récupération des données
  const { data: clients = [], loading: loadingClients } = useClients();
  const { data: dishes = [], loading: loadingDishes } = useDishes();
  const { data: ingredients = [], loading: loadingIngredients } = useIngredients();

  // États pour le formulaire
  const [selectedClient, setSelectedClient] = useState<Client | null>(order?.client || null);
  const [selectedDishes, setSelectedDishes] = useState<OrderDish[]>(
    order?.dishes ||
    ((order as any)?.items || []).map((item: any) => ({
      dish: item.dish || {
        id: item.id || item.label,
        name: item.label || item.name || 'Élément',
        image: '',
        ingredients: [],
        preparationTime: 0,
        servings: 1,
        description: '',
      },
      quantity: item.quantity || 1,
      name: item.label || item.name || '',
      ingredients: [],
      additionalIngredients: [],
    }))
  );
  const [editableItems, setEditableItems] = useState<EditableOrderItem[]>(
    ((order as any)?.items || []).map((item: any) => ({
      id: item.id,
      label:
        item.label ||
        item.name ||
        item.dish?.name ||
        'Élément',
      quantity: item.quantity || 1,
      numberOfDays: item.numberOfDays || 1,
      unitPrice: item.unitPrice || 0,
      total: item.total || 0,
      dish: item.dish,
    }))
  );
  const [additionalIngredients, setAdditionalIngredients] = useState<OrderIngredient[]>(
    order?.additionalIngredients || []
  );
  const [deliveryDate, setDeliveryDate] = useState(
    order?.deliveryDate ||
    (order as any)?.dateLivraison ||
    ''
  );

  const [deliveryTime, setDeliveryTime] = useState(
    order?.deliveryTime || ''
  );

  const [address, setAddress] = useState(
    order?.address ||
    order?.deliveryAddress ||
    ''
  );

  const [designation, setDesignation] = useState(
    order?.designation ||
    (order as any)?.name ||
    ''
  );

  const getInitialGuestCount = () => {
    const count =
      (order as any)?.guestCount ||
      (order as any)?.numberOfGuests ||
      (order as any)?.guests ||
      (order as any)?.pax ||
      0;

    return count > 0 ? String(count) : '';
  };

  const [guestCount, setGuestCount] = useState(getInitialGuestCount());
  const getInitialBilledAmount = () => {
    const amount =
      order?.billedAmount ||
      (order as any)?.totals?.subtotal ||
      (order as any)?.pricingReference?.totalHT ||
      (order as any)?.totals?.total ||
      0;

    return amount > 0 ? String(amount) : '';
  };

  const [billedAmount, setBilledAmount] = useState(getInitialBilledAmount());
  const [formError, setFormError] = useState<string | null>(null);

  // États pour la recherche
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [dishSearchQuery, setDishSearchQuery] = useState('');
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState('');

  // ✅ important : si order contient déjà un clientId, on masque la recherche par défaut
  const [showClientSearch, setShowClientSearch] = useState(!order?.clientId);


  const [showDeliveryDatePicker, setShowDeliveryDatePicker] = useState(false);
  const [showDeliveryTimePicker, setShowDeliveryTimePicker] = useState(false);


  const [deliveryDateObj, setDeliveryDateObj] = useState<Date | null>(
    order?.deliveryDate
      ? new Date(order.deliveryDate)
      : (order as any)?.dateLivraison
        ? new Date((order as any).dateLivraison)
        : null
  );

  const [deliveryTimeObj, setDeliveryTimeObj] = useState<Date | null>(null);


  /* =========================================================
     ✅ FIX PRINCIPAL : auto-sélection du client via clientId
     (ordre créé depuis simulation = order.client undefined)
  ========================================================= */
  useEffect(() => {
    if (!order?.clientId) return;
    if (!clients || clients.length === 0) return;

    // si déjà sélectionné et correspond, on ne touche pas
    if (selectedClient?.id === order.clientId) return;

    const found = clients.find((c) => c.id === order.clientId) || null;
    if (found) {
      setSelectedClient(found);
      setShowClientSearch(false);

      // optionnel : pré-remplir l'adresse si vide
      setAddress((prev) => (prev ? prev : found.address || ''));
    }
  }, [order?.clientId, clients]);

  /* =========================================================
     ✅ BONUS : si la prop "order" change (async), on resync
     (utile si le form est monté avant que orderDraft arrive)
  ========================================================= */
  useEffect(() => {
    if (!order) return;
    setEditableItems(
      ((order as any)?.items || []).map((item: any) => ({
        id: item.id,
        label:
          item.label ||
          item.name ||
          item.dish?.name ||
          'Élément',
        quantity: item.quantity || 1,
        numberOfDays: item.numberOfDays || 1,
        unitPrice: item.unitPrice || 0,
        total: item.total || 0,
        dish: item.dish,
      }))
    );

    // On resync les champs simples si jamais order arrive après
    setSelectedDishes(
      order.dishes ||
      ((order as any)?.items || []).map((item: any) => ({
        dish: item.dish || {
          id: item.id || item.label,
          name: item.label || item.name || 'Élément',
          image: '',
          ingredients: [],
          preparationTime: 0,
          servings: 1,
          description: '',
        },
        quantity: item.quantity || 1,
        name: item.label || item.name || '',
        ingredients: [],
        additionalIngredients: [],
      }))
    );
    setAdditionalIngredients(order.additionalIngredients || []);
    setDeliveryDate(
      order.deliveryDate ||
      (order as any)?.dateLivraison ||
      ''
    );

    setDeliveryTime(order.deliveryTime || '');

    setAddress(
      order.address ||
      order.deliveryAddress ||
      ''
    );

    setDesignation(
      order.designation ||
      (order as any)?.name ||
      ''
    );

    const count =
      (order as any)?.guestCount ||
      (order as any)?.numberOfGuests ||
      (order as any)?.guests ||
      (order as any)?.pax ||
      0;

    setGuestCount(count > 0 ? String(count) : '');
    const amount =
      order.billedAmount ||
      (order as any)?.totals?.subtotal ||
      (order as any)?.pricingReference?.totalHT ||
      (order as any)?.totals?.total ||
      0;

    setBilledAmount(amount > 0 ? String(amount) : '');


    // Si on a un client complet sur order.client, on le prend
    if (order.client) {
      setSelectedClient(order.client);
      setShowClientSearch(false);
    }
  }, [order?.id]); // on se base sur un changement d'identité (draft différent)

  // Filtrage des clients et plats
  const filteredClients = clients.filter((client) =>
    (client.name && client.name.toLowerCase().includes(clientSearchQuery.toLowerCase())) ||
    (client.email && client.email.toLowerCase().includes(clientSearchQuery.toLowerCase()))
  );

  const filteredDishes = dishes.filter((dish) =>
    dish.name && dish.name.toLowerCase().includes(dishSearchQuery.toLowerCase())
  );

  const filteredIngredients = ingredients.filter((ingredient) =>
    (ingredient.name && ingredient.name.toLowerCase().includes(ingredientSearchQuery.toLowerCase())) ||
    (ingredient.category && ingredient.category.toLowerCase().includes(ingredientSearchQuery.toLowerCase()))
  );

  const handleAddIngredient = (ingredient: Ingredient) => {
    const existingIngredient = additionalIngredients.find(
      (item) => item.ingredient.id === ingredient.id
    );

    if (existingIngredient) {
      handleUpdateIngredientQuantity(ingredient.id, existingIngredient.quantity + 1);
    } else {
      setAdditionalIngredients([
        ...additionalIngredients,
        { ingredient, quantity: 1 },
      ]);
    }
  };

  const handleUpdateIngredientQuantity = (ingredientId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveIngredient(ingredientId);
      return;
    }

    setAdditionalIngredients((prev) =>
      prev.map((item) =>
        item.ingredient.id === ingredientId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveIngredient = (ingredientId: string) => {
    setAdditionalIngredients((prev) =>
      prev.filter((item) => item.ingredient.id !== ingredientId)
    );
  };

  const handleAddDish = (dish: Dish) => {
    const existingDish = selectedDishes.find((d) => d.dish.id === dish.id);
    if (existingDish) {
      setSelectedDishes((prev) =>
        prev.map((d) =>
          d.dish.id === dish.id ? { ...d, quantity: d.quantity + 1 } : d
        )
      );
    } else {
      setSelectedDishes((prev) => [
        ...prev,
        {
          dish,
          quantity: 1,
          name: dish.name,
          ingredients: dish.ingredients,
          additionalIngredients: [],
        },
      ]);
    }
  };

  const handleUpdateDishQuantity = (dishId: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedDishes((prev) => prev.filter((d) => d.dish.id !== dishId));
    } else {
      setSelectedDishes((prev) =>
        prev.map((d) =>
          d.dish.id === dishId ? { ...d, quantity } : d
        )
      );
    }
  };
  const updateEditableItemQuantity = (index: number, quantity: number) => {
    setEditableItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        const cleanQuantity = Math.max(1, quantity || 1);
        const numberOfDays = item.numberOfDays || 1;
        const unitPrice = item.unitPrice || 0;

        return {
          ...item,
          quantity: cleanQuantity,
          total: cleanQuantity * numberOfDays * unitPrice,
        };
      })
    );
  };

  const updateEditableItemDays = (index: number, numberOfDays: number) => {
    setEditableItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        const cleanDays = Math.max(1, numberOfDays || 1);
        const quantity = item.quantity || 1;
        const unitPrice = item.unitPrice || 0;

        return {
          ...item,
          numberOfDays: cleanDays,
          total: quantity * cleanDays * unitPrice,
        };
      })
    );
  };
  const getIngredientPrice = (item: any) => {
    const ingredient = item?.ingredient || item;

    return Number(
      item?.unitPrice ||
      item?.price ||
      item?.cost ||
      ingredient?.unitPrice ||
      ingredient?.price ||
      ingredient?.cost ||
      0
    );
  };

  const getIngredientQuantity = (item: any) => {
    return Number(
      item?.quantity ||
      item?.qty ||
      item?.amount ||
      0
    );
  };

  const operationalDishes = useMemo(() => {
    return selectedDishes.map((selectedDish: any) => {
      const dish = selectedDish.dish;
      const dishQuantity = Number(selectedDish.quantity || 0);
      const dishIngredients = Array.isArray(dish?.ingredients)
        ? dish.ingredients
        : [];

      const ingredientsCost = dishIngredients.reduce((sum: number, item: any) => {
        const quantity = getIngredientQuantity(item);
        const unitPrice = getIngredientPrice(item);

        return sum + quantity * unitPrice;
      }, 0);

      const totalCost = dishQuantity * ingredientsCost;

      return {
        dishId: dish?.id,
        name: dish?.name || selectedDish.name || 'Plat',
        quantity: dishQuantity,
        unitProductionCost: ingredientsCost,
        totalProductionCost: totalCost,
        ingredients: dishIngredients.map((item: any) => {
          const ingredient = item?.ingredient || item;
          const quantity = getIngredientQuantity(item);
          const unitPrice = getIngredientPrice(item);

          return {
            id: ingredient?.id,
            name: ingredient?.name || 'Ingrédient',
            unit: ingredient?.unit || '',
            quantity,
            unitPrice,
            total: quantity * unitPrice,
          };
        }),
      };
    });
  }, [selectedDishes]);

  const operationalAdditionalIngredients = useMemo(() => {
    return additionalIngredients.map((item: any) => {
      const ingredient = item.ingredient;
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(
        ingredient?.price ||
        ingredient?.unitPrice ||
        0
      );

      return {
        id: ingredient?.id,
        name: ingredient?.name || 'Ingrédient',
        category: ingredient?.category || '',
        unit: ingredient?.unit || '',
        quantity,
        unitPrice,
        total: quantity * unitPrice,
      };
    });
  }, [additionalIngredients]);

  const operationalCosts = useMemo(() => {
    const dishesCost = operationalDishes.reduce(
      (sum, dish) => sum + dish.totalProductionCost,
      0
    );

    const additionalIngredientsCost = operationalAdditionalIngredients.reduce(
      (sum, ingredient) => sum + ingredient.total,
      0
    );

    return {
      dishesCost,
      additionalIngredientsCost,
      totalProductionCost: dishesCost + additionalIngredientsCost,
    };
  }, [operationalDishes, operationalAdditionalIngredients]);
  const validateForm = () => {
    if (!selectedClient) {
      setFormError('Veuillez sélectionner un client');
      return false;
    }
    if (selectedDishes.length === 0 && editableItems.length === 0) {
      setFormError('Veuillez ajouter au moins un élément à la commande');
      return false;
    }
    if (!deliveryDate) {
      setFormError('Veuillez spécifier une date de livraison');
      return false;
    }

    if (!address) {
      setFormError('Veuillez spécifier une adresse de livraison');
      return false;
    }
    if (billedAmount && isNaN(Number(billedAmount))) {
      setFormError('Le montant facturé doit être un nombre');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    Keyboard.dismiss();
    onSubmit({
      clientId: selectedClient!.id,
      client: selectedClient!,
      status: order?.status || 'En cours',
      dishes: selectedDishes,
      guestCount: guestCount ? Number(guestCount) : undefined,


      items:
        editableItems.length > 0
          ? editableItems.map((item) => ({
            ...item,
            total:
              (item.quantity || 0) *
              (item.numberOfDays || 1) *
              (item.unitPrice || 0),
          }))
          : selectedDishes.map((d) => ({
            id: d.dish.id,
            label: d.dish.name,
            quantity: d.quantity,
            numberOfDays: 1,
            unitPrice: 0,
            total: 0,
            dish: d.dish,
          })),
      additionalIngredients,
      operationalDishes,
      operationalAdditionalIngredients,
      operationalCosts,


      deliveryDate,
      dateLivraison: deliveryDate,
      deliveryTime,
      address,
      deliveryAddress: address,
      designation: designation || undefined,
      billedAmount: billedAmount ? Number(billedAmount) : undefined,


    } as any);
  };

  if (loadingClients || loadingDishes || loadingIngredients) {
    return <LoadingSpinner />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          {order ? 'Modifier la commande' : 'Nouvelle commande'}
        </Text>
        <TouchableOpacity onPress={onClose}>
          <Icon name="close" size={24} color="#665" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{
          paddingBottom: 140,
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="interactive"
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
      >
        {formError && (
          <View style={styles.errorContainer}>
            <ErrorMessage message={formError} />
          </View>
        )}

        {/* ======================
            CLIENT
        ====================== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client</Text>
          {selectedClient && !showClientSearch ? (
            <View style={styles.selectedClient}>
              <Image
                source={
                  selectedClient.profilePicture
                    ? { uri: selectedClient.profilePicture }
                    : require('@/assets/images/no_client_picture_small.jpg')
                }
                style={styles.clientImage}
              />
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{selectedClient.name}</Text>
                <Text style={styles.clientMeta}>{selectedClient.email}</Text>
                <Text style={styles.clientMeta}>{selectedClient.phone}</Text>
              </View>

              {/* Ici tu avais {!order && ...}. On garde ta logique mais on permet aussi de changer si tu veux.
                 Si tu veux empêcher la modification quand la commande vient d’une simulation, laisse comme ça. */}
              {!order && (
                <TouchableOpacity
                  style={styles.changeButton}
                  onPress={() => setShowClientSearch(true)}
                >
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
                  submitBehavior="blurAndSubmit"
                  onChangeText={setClientSearchQuery}
                />
              </View>

              <ScrollView style={styles.searchResults}>
                {filteredClients.map((client) => (
                  <TouchableOpacity
                    key={client.id}
                    style={styles.clientResult}
                    onPress={() => {
                      setSelectedClient(client);
                      setShowClientSearch(false);
                      setAddress(client.address);
                    }}
                  >
                    <Image
                      source={
                        client.profilePicture
                          ? { uri: client.profilePicture }
                          : require('@/assets/images/no_client_picture_small.jpg')
                      }
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
        {editableItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Éléments de la commande</Text>

            {editableItems.map((item, index) => (
              <View key={item.id || index} style={styles.editableItemCard}>
                <Text style={styles.editableItemTitle}>{item.label}</Text>

                <View style={styles.editableRow}>
                  <Text style={styles.editableLabel}>Quantité</Text>

                  <TextInput
                    style={styles.editableInput}
                    value={String(item.quantity || 1)}
                    onChangeText={(value) => {
                      const parsed = parseInt(value, 10);

                      updateEditableItemQuantity(
                        index,
                        isNaN(parsed) ? 1 : parsed
                      );
                    }}
                    submitBehavior="blurAndSubmit"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.editableRow}>
                  <Text style={styles.editableLabel}>Jours</Text>

                  <TextInput
                    style={styles.editableInput}
                    value={String(item.numberOfDays || 1)}
                    onChangeText={(value) => {
                      const parsed = parseInt(value, 10);

                      updateEditableItemDays(
                        index,
                        isNaN(parsed) ? 1 : parsed
                      );
                    }}
                    submitBehavior="blurAndSubmit"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            ))}
          </View>
        )}
        {/* ======================
            PLATS
        ====================== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plats</Text>

          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un plat..."
              value={dishSearchQuery}
              submitBehavior="blurAndSubmit"
              onChangeText={setDishSearchQuery}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dishesScroll}
            contentContainerStyle={styles.dishesContainer}
          >
            {filteredDishes.map((dish) => (
              <TouchableOpacity
                key={dish.id}
                style={styles.dishCard}
                onPress={() => handleAddDish(dish)}
              >
                <Image
                  source={
                    dish.image
                      ? { uri: dish.image }
                      : require('@/assets/images/no_dishes_picture.jpg')
                  }
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

              {selectedDishes &&
                Array.isArray(selectedDishes) &&
                selectedDishes.map(({ dish, quantity }) => {
                  if (!dish || !dish.id) return null;
                  return (
                    <View key={dish.id} style={styles.selectedDishItem}>
                      <Image
                        source={{
                          uri: dish.image || 'https://via.placeholder.com/100',
                        }}
                        style={styles.selectedDishImage}
                      />
                      <View style={styles.selectedDishInfo}>
                        <Text style={styles.selectedDishName}>{dish.name}</Text>
                        <View style={styles.quantityContainer}>
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() =>
                              handleUpdateDishQuantity(dish.id, quantity - 1)
                            }
                          >
                            <Text style={styles.quantityButtonText}>-</Text>
                          </TouchableOpacity>
                          <Text style={styles.quantityText}>{quantity}</Text>
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() =>
                              handleUpdateDishQuantity(dish.id, quantity + 1)
                            }
                          >
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

        {/* ====================== */}
        <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>INGRÉDIENTS SUPPLÉMENTAIRES</Text>
        {/* ====================== */}
        {/* ⚠️ NOTE: tu avais un ScrollView imbriqué dans un ScrollView.
            Je garde ta structure pour ne pas “casser”, mais idéalement on évite un ScrollView vertical dans un autre.
        */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingrédients supplémentaires</Text>

          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#665" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un ingrédient..."
              value={ingredientSearchQuery}
              submitBehavior="blurAndSubmit"
              onChangeText={setIngredientSearchQuery}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.ingredientsScroll}
            contentContainerStyle={styles.ingredientsContainer}
          >
            {filteredIngredients &&
              Array.isArray(filteredIngredients) &&
              filteredIngredients.map((ingredient) => {
                if (!ingredient || !ingredient.id) return null;
                return (
                  <TouchableOpacity
                    key={ingredient.id}
                    style={styles.ingredientCard}
                    onPress={() => handleAddIngredient(ingredient)}
                  >
                    <View style={styles.ingredientCardContent}>
                      <Text style={styles.ingredientName}>
                        {ingredient.name}
                      </Text>
                      <Text style={styles.ingredientCategory}>
                        {ingredient.category}
                      </Text>
                      <View style={styles.ingredientPrice}>
                        <Icon name="attach-money" size={14} color="#007AFF" />
                        <Text style={styles.priceText}>
                          {formatCurrency(ingredient.price || 0)} /{' '}
                          {ingredient.unit}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
          </ScrollView>

          {additionalIngredients.length > 0 && (
            <View style={styles.selectedIngredients}>
              <Text style={styles.subsectionTitle}>
                Ingrédients sélectionnés
              </Text>

              {additionalIngredients &&
                Array.isArray(additionalIngredients) &&
                additionalIngredients.map(({ ingredient, quantity }) => {
                  if (!ingredient || !ingredient.id) return null;
                  return (
                    <View
                      key={ingredient.id}
                      style={styles.selectedIngredientItem}
                    >
                      <View style={styles.selectedIngredientInfo}>
                        <Text style={styles.selectedIngredientName}>
                          {ingredient.name}
                        </Text>
                        <Text style={styles.selectedIngredientCategory}>
                          {ingredient.category}
                        </Text>
                      </View>

                      <View style={styles.quantityContainer}>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() =>
                            handleUpdateIngredientQuantity(
                              ingredient.id,
                              quantity - 1
                            )
                          }
                        >
                          <Text style={styles.quantityButtonText}>-</Text>
                        </TouchableOpacity>

                        <View style={styles.quantityInputContainer}>
                          <TextInput
                            style={styles.quantityInput}
                            value={quantity.toString()}
                            onChangeText={(value) =>
                              handleUpdateIngredientQuantity(
                                ingredient.id,
                                parseFloat(value) || 0
                              )
                            }
                            submitBehavior="blurAndSubmit"
                            keyboardType="decimal-pad"
                          />
                          <Text style={styles.unitText}>{ingredient.unit}</Text>
                        </View>

                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() =>
                            handleUpdateIngredientQuantity(
                              ingredient.id,
                              quantity + 1
                            )
                          }
                        >
                          <Text style={styles.quantityButtonText}>+</Text>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveIngredient(ingredient.id)}
                      >
                        <Icon name="close" size={20} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
            </View>
          )}
        </View>

        {/* ======================
            DÉTAILS LIVRAISON + CHAMPS
        ====================== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails de livraison</Text>

          <View style={styles.formField}>
            <Text style={styles.label}>Date de livraison</Text>
            <View style={styles.inputContainer}>
              <Icon name="event" size={20} color="#665" />
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDeliveryDatePicker(true)}
              >
                <Text style={{ color: deliveryDate ? '#000' : '#9CA3AF' }}>
                  {deliveryDate || 'Sélectionner une date'}
                </Text>
              </TouchableOpacity>

              {showDeliveryDatePicker && (
                <DateTimePicker
                  value={deliveryDateObj || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDeliveryDatePicker(false);
                    if (selectedDate) {
                      setDeliveryDateObj(selectedDate);
                      const iso = selectedDate.toISOString().split('T')[0];
                      setDeliveryDate(iso);
                    }
                  }}
                />
              )}
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Heure de livraison</Text>
            <View style={styles.inputContainer}>
              <Icon name="access-time" size={20} color="#665" />
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDeliveryTimePicker(true)}
              >
                <Text style={{ color: deliveryTime ? '#000' : '#9CA3AF' }}>
                  {deliveryTime || 'Sélectionner une heure'}
                </Text>
              </TouchableOpacity>

              {showDeliveryTimePicker && (
                <DateTimePicker
                  value={deliveryTimeObj || new Date()}
                  mode="time"
                  display="default"
                  onChange={(event, selectedTime) => {
                    setShowDeliveryTimePicker(false);
                    if (selectedTime) {
                      setDeliveryTimeObj(selectedTime);
                      const time = selectedTime
                        .toTimeString()
                        .slice(0, 5); // HH:mm
                      setDeliveryTime(time);
                    }
                  }}
                />
              )}
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
                submitBehavior="blurAndSubmit"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Nombre de convives</Text>
            <View style={styles.inputContainer}>
              <Icon name="groups" size={20} color="#665" />
              <TextInput
                style={styles.input}
                placeholder="Ex : 100"
                value={guestCount}
                onChangeText={setGuestCount}
                submitBehavior="blurAndSubmit"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Champs supplémentaires */}
          <View style={styles.formField}>
            <Text style={styles.label}>Désignation</Text>
            <View style={styles.inputContainer}>
              <Icon name="description" size={20} color="#665" />
              <TextInput
                style={styles.input}
                placeholder="Désignation de la commande"
                value={designation}
                submitBehavior="blurAndSubmit"
                onChangeText={setDesignation}
              />
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Montant facturé</Text>
            <View style={styles.inputContainer}>
              <Icon name="attach-money" size={20} color="#665" />
              <TextInput
                style={styles.input}
                placeholder="Montant facturé (USD)"
                value={billedAmount}
                onChangeText={setBilledAmount}
                submitBehavior="blurAndSubmit"
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>

        {/* ======================
            TOTAL
        ====================== */}
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Coût interne de production</Text>

          <Text style={{ color: '#6B7280', marginBottom: 8 }}>
            Ce montant est destiné aux achats et à la cuisine. Il ne correspond pas au montant facturé au client.
          </Text>

          <View style={{ marginBottom: 8 }}>
            <Text>Coût des plats : {formatCurrency(operationalCosts.dishesCost)}</Text>
            <Text>
              Ingrédients supplémentaires : {formatCurrency(operationalCosts.additionalIngredientsCost)}
            </Text>
          </View>

          <View style={styles.totalAmount}>
            <Icon name="shopping-cart" size={24} color="#007AFF" />
            <Text style={styles.totalValue}>
              {formatCurrency(operationalCosts.totalProductionCost)}
            </Text>
          </View>
        </View>

        {/* ======================
            FOOTER ACTIONS
        ====================== */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>
              {order ? 'Modifier la commande' : 'Créer la commande'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}