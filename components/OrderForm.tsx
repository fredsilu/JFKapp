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
import { formatCurrency } from '@/src/utils/costs';
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
    gap: 12,
    paddingTop: 20,
    paddingBottom: 30,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#374151',
  },
  submitButton: {
    flex: 1.4,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
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
  infoItemCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  infoItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },

  infoItemMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },

  infoItemAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
  },

  productionDishCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  productionDishHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },

  productionDishImage: {
    width: 54,
    height: 54,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },

  productionDishName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111827',
  },

  productionDishMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
    fontWeight: '600',
  },

  productionQuantityRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  productionQuantityText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },

  productionIngredientCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  productionIngredientName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
  },

  productionIngredientMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
    fontWeight: '600',
  },

  productionIngredientTotal: {
    fontSize: 13,
    color: '#059669',
    marginTop: 4,
    fontWeight: '900',
  },
  blockSubtotal: {
    marginTop: 10,
    padding: 10,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    gap: 6,
  },

  blockSubtotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#3730A3',
  },

  blockSubtotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E3A8A',
    textAlign: 'right',
  },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },

  stepperButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },

  stepperButtonText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },

  stepperValue: {
    minWidth: 36,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
  },
  operationBlockHeader: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  operationBlockText: {
    flex: 1,
    minWidth: 0,
  },

  operationBlockIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },

  operationBlockTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },

  operationBlockSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },

  moneyInput: {
    fontWeight: '900',
    fontSize: 16,
    color: '#111827',
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
    order?.dishes || []
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
    setSelectedDishes(order.dishes || []);
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
        ingredientId: ingredient?.id,
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


  const serviceTraiteurAmount = useMemo(() => {
    return editableItems.reduce((sum, item) => {
      const label = (item.label || '').toLowerCase();

      const isServiceTraiteur =
        label.includes('service traiteur');

      if (isServiceTraiteur) {
        return (
          sum +
          (
            (item.quantity || 0) *
            (item.numberOfDays || 1) *
            (item.unitPrice || 0)
          )
        );
      }

      return sum;
    }, 0);
  }, [editableItems]);

  const billedAmountValue = Number(billedAmount || 0);

  const productionReferenceRevenue =
    billedAmountValue - serviceTraiteurAmount;

  const productionCostRatio =
    productionReferenceRevenue > 0
      ? (
        operationalCosts.totalProductionCost /
        productionReferenceRevenue
      ) * 100
      : 0;
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
            <Text style={styles.sectionTitle}>Éléments facturés / Proforma</Text>

            {editableItems.map((item, index) => {
              const total =
                (item.quantity || 0) *
                (item.numberOfDays || 1) *
                (item.unitPrice || 0);

              return (
                <View key={item.id || index} style={styles.infoItemCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoItemTitle}>{item.label}</Text>
                    <Text style={styles.infoItemMeta}>
                      Qté : {item.quantity || 0} × {item.numberOfDays || 1} jour(s)
                    </Text>

                    <Text style={styles.infoItemMeta}>
                      PU : {formatCurrency(item.unitPrice || 0)}
                    </Text>
                  </View>

                  <Text style={styles.infoItemAmount}>
                    {formatCurrency(total)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
        {/* ======================
            PLATS
        ====================== */}
        <View style={styles.section}>
          <View style={styles.operationBlockHeader}>
            <View style={styles.operationBlockText}>
              <Text style={styles.operationBlockTitle}>Plats à produire</Text>
              <Text style={styles.operationBlockSubtitle}>
                Sélection cuisine et coût de production
              </Text>
            </View>

            <View style={styles.operationBlockIcon}>
              <Icon name="restaurant" size={22} color="#2563EB" />
            </View>
          </View>

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
              {selectedDishes.map(({ dish, quantity }) => {
                if (!dish || !dish.id) return null;

                const operationalDish = operationalDishes.find(
                  (item) => item.dishId === dish.id
                );

                const unitCost = operationalDish?.unitProductionCost || 0;
                const totalCost = operationalDish?.totalProductionCost || 0;

                return (
                  <View key={dish.id} style={styles.productionDishCard}>
                    <View style={styles.productionDishHeader}>
                      <Image
                        source={
                          dish.image
                            ? { uri: dish.image }
                            : require('@/assets/images/no_dishes_picture.jpg')
                        }
                        style={styles.productionDishImage}
                      />

                      <View style={{ flex: 1 }}>
                        <Text style={styles.productionDishName}>
                          {dish.name}
                        </Text>

                        <Text style={styles.productionDishMeta}>
                          Coût unitaire : {formatCurrency(unitCost)}
                        </Text>

                        <Text style={styles.productionDishMeta}>
                          Coût total : {formatCurrency(totalCost)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.productionQuantityRow}>
                      <Text style={styles.productionQuantityText}>
                        Quantité
                      </Text>

                      <View style={styles.stepper}>
                        <TouchableOpacity
                          style={styles.stepperButton}
                          onPress={() => handleUpdateDishQuantity(dish.id, quantity - 1)}
                        >
                          <Text style={styles.stepperButtonText}>-</Text>
                        </TouchableOpacity>

                        <Text style={styles.stepperValue}>{quantity}</Text>

                        <TouchableOpacity
                          style={styles.stepperButton}
                          onPress={() => handleUpdateDishQuantity(dish.id, quantity + 1)}
                        >
                          <Text style={styles.stepperButtonText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}

              <View style={styles.blockSubtotal}>
                <Text style={styles.blockSubtotalLabel}>Total plats sélectionnés</Text>
                <Text style={styles.blockSubtotalValue}>
                  {formatCurrency(operationalCosts.dishesCost)}
                </Text>
              </View>

            </View>
          )}
        </View>

        {/* ====================== */}
        <View style={styles.operationBlockHeader}>
          <View style={styles.operationBlockText}>
            <Text style={styles.operationBlockTitle}>Achats complémentaires</Text>
            <Text style={styles.operationBlockSubtitle}>
              Ingrédients ajoutés pour cette commande
            </Text>
          </View>

          <View style={[styles.operationBlockIcon, { backgroundColor: '#ECFDF5' }]}>
            <Icon name="shopping-cart" size={22} color="#059669" />
          </View>
        </View>
        {/* ====================== */}
        {/* ⚠️ NOTE: tu avais un ScrollView imbriqué dans un ScrollView.
            Je garde ta structure pour ne pas “casser”, mais idéalement on évite un ScrollView vertical dans un autre.
        */}
        <View style={styles.section}>
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

              {operationalAdditionalIngredients.map((item: any) => {
                return (
                  <View key={item.id} style={styles.productionIngredientCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productionIngredientName}>
                        {item.name}
                      </Text>

                      <Text style={styles.productionIngredientMeta}>
                        {item.quantity} {item.unit} × {formatCurrency(item.unitPrice)}
                      </Text>

                      <Text style={styles.productionIngredientTotal}>
                        Total : {formatCurrency(item.total)}
                      </Text>
                    </View>
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        style={styles.stepperButton}
                        onPress={() =>
                          handleUpdateIngredientQuantity(
                            item.ingredientId,
                            item.quantity - 1
                          )
                        }
                      >
                        <Text style={styles.stepperButtonText}>-</Text>
                      </TouchableOpacity>

                      <Text style={styles.stepperValue}>
                        {item.quantity}
                      </Text>

                      <TouchableOpacity
                        style={styles.stepperButton}
                        onPress={() =>
                          handleUpdateIngredientQuantity(
                            item.ingredientId,
                            item.quantity + 1
                          )
                        }
                      >
                        <Text style={styles.stepperButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              <View style={styles.blockSubtotal}>
                <Text style={styles.blockSubtotalLabel}>Total ingrédients supplémentaires</Text>
                <Text style={styles.blockSubtotalValue}>
                  {formatCurrency(operationalCosts.additionalIngredientsCost)}
                </Text>
              </View>
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
                style={[styles.input, styles.moneyInput]}
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
          <Text
            style={{
              marginTop: 6,
              fontSize: 13,
              fontWeight: '800',
              color:
                productionCostRatio >= 70
                  ? '#DC2626'
                  : productionCostRatio >= 50
                    ? '#D97706'
                    : '#059669',
            }}
          >
            Taux de coût de production : {productionCostRatio.toFixed(1)}%
          </Text>
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