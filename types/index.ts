import { RouteProp } from '@react-navigation/native';

// Client types
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  rccm?: string;
  idnat?: string;
  city?: string;
  notes?: string;
  totalOrders: number;
  lastOrderDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  profilePicture?: string; // URL to the profile picture
}
export type IngredientDetailsRouteProp = RouteProp<RootStackParamList, 'IngredientDetails'>;
// Navigation types
export type RootStackParamList = {
  Home: undefined;
  ClientDetails: { clientId: string };
  IngredientDetails: { ingredientId: string };
  DishDetails: { dishId: string };
  OrderDetails: { orderId: string };
  OrderForm: undefined;
};

// Ingredient types
export interface Ingredient {
  id: string;
  name: string;
  price: number;
  unit: string;
  quantity: number;
  description: string; // Add this line
  stock: number;
  category: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Dish ingredient with quantity
export interface DishIngredient {
  ingredient: Ingredient;
  quantity: number;
}

// Dish types
export interface Dish {
  id: string;
  name: string;
  description: string;
  image: string;
  ingredients: DishIngredient[];
  preparationTime: number;
  servings: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Order types
export interface OrderDish {
  name: string;
  dish: Dish;
  quantity: number;
  ingredients: DishIngredient[];
  additionalIngredients: DishIngredient[];
}



export interface OrderIngredient {
  ingredient: Ingredient;
  quantity: number;
}


export interface Order {
  id: string;

  // Identification
  number?: string;
  orderNumber?: string;
  documentType?: 'order' | 'proforma' | 'invoice';
  version?: number;

  // Client
  clientId: string;
  client: Client;

  // Statut opérationnel
  status:
    | 'draft'
    | 'confirmed'
    | 'converted'
    | 'En cours'
    | 'En préparation'
    | 'Livré'
    | 'Facturé'
    | 'Annulé';

  // Liens documents
  proformaId?: string;
  proformaNumber?: string;
  invoiceId?: string | null;
  fromSimulationId?: string;
  simulationId?: string;

  // Contenu commande ancien format
  dishes?: OrderDish[];

  // Contenu commande nouveau format
  items?: {
    id?: string;
    label?: string;
    name?: string;
    quantity: number;
    unitPrice?: number;
    total?: number;
    dish?: Dish;
  }[];

  additionalIngredients?: OrderIngredient[];

  // Livraison / événement
  deliveryAddress?: string;
  deliveryDate?: string;
  deliveryTime?: string;
  dateLivraison?: string;
  address?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;

  // Informations business
  designation?: string;
  name?: string;
  guestCount?: number;
  comment?: string;

  // Montants
  billedAmount?: number;
  simulatedAmount?: number;
  totals?: {
    subtotal?: number;
    discount?: number;
    total?: number;
    currency?: 'USD' | 'CDF';
  };

  pricingReference?: {
    totalHT?: number;
    totalCost?: number;
    margin?: number;
  };

  // Dates système
  createdAt: string | Date;
  updatedAt?: string | Date;
  confirmedAt?: any;

  invoiceDate?: string;
  paymentDate?: string;
}




export type DishDetailsProps = {
  dish: Dish;
  onClose: () => void;
};

export interface OrderDetailsProps {
  order: Order;
  onClose: () => void;
}

// Ensure OrderForm is a valid React component
export interface OrderFormProps {
  order?: Order;
  onClose: () => void;
  onSubmit: (values: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

interface AnyObject {
  [key: string]: any;
}

interface CleanObjectFunction {
  (obj: AnyObject): AnyObject;
}

export const cleanObject: CleanObjectFunction = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined)
  );
};

export interface ClientDetailsProps {
  client: Client;
  onClose: () => void;
}


export interface IngredientDetailsProps {
  ingredient: Ingredient;
  ingredientId: string;
  name: string;
  quantity: number;
  description: string;
  onClose: () => void;
  // Removed duplicate OrderFormProps interfacenClose: () => void;
  onSubmit: (values: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => void;
}