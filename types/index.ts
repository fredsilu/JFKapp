// types/index.ts
import { RouteProp } from '@react-navigation/native';

/* =========================
   NAVIGATION
========================= */

export type RootStackParamList = {
  Home: undefined;
  ClientDetails: { clientId: string };
  IngredientDetails: { ingredientId: string };
  DishDetails: { dishId: string };
  OrderDetails: { orderId: string };
  OrderForm: undefined;
};

export type IngredientDetailsRouteProp = RouteProp<
  RootStackParamList,
  'IngredientDetails'
>;

/* =========================
   CLIENT
========================= */

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  rccm?: string;
  idNat?: string;
  nif?: string;
  city?: string;
  notes?: string;
  totalOrders?: number;
  lastOrderDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  profilePicture?: string;
}

/* =========================
   INGREDIENT
========================= */

export interface Ingredient {
  id: string;
  name: string;
  price: number;
  unit: string;
  quantity?: number;
  description?: string;
  stock?: number;
  category: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/* =========================
   DISH
========================= */

export interface DishIngredient {
  ingredient: Ingredient;
  quantity: number;
}

export interface Dish {
  id: string;
  name: string;
  description?: string;
  image?: string;
  ingredients?: DishIngredient[];
  preparationTime?: number;
  servings?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/* =========================
   ORDER ITEMS
========================= */

export interface OrderDish {
  name?: string;
  dish: Dish;
  quantity: number;
  ingredients?: DishIngredient[];
  additionalIngredients?: DishIngredient[];
}

export interface OrderIngredient {
  ingredient: Ingredient;
  quantity: number;
}

export interface OrderItem {
  id?: string;
  label?: string;
  name?: string;
  quantity: number;
  numberOfDays?: number;
  unitPrice?: number;
  total?: number;
  dish?: Dish;
}

/* =========================
   OPERATIONAL
========================= */

export interface OperationalDish {
  dishId?: string;
  name: string;
  quantity: number;
  unitProductionCost?: number;
  totalProductionCost?: number;
  ingredients?: {
    id?: string;
    name: string;
    unit?: string;
    quantity: number;
    unitPrice?: number;
    total?: number;
  }[];
}

export interface OperationalIngredient {
  id?: string;
  ingredientId?: string;
  name?: string;
  ingredient?: Ingredient;
  unit?: string;
  quantity: number;
  unitPrice?: number;
  price?: number;
  total?: number;
}

export interface OperationalCosts {
  dishesCost: number;
  additionalIngredientsCost: number;
  totalProductionCost: number;
}

/* =========================
   ORDER
========================= */

export interface Order {
  id: string;

  // Identification
  number?: string;
  orderNumber?: string;
  documentType?: 'order' | 'proforma' | 'invoice';
  version?: number;

  // Client
  clientId?: string;
  client?: Client;

  // Statut
  status?:
    | 'draft'
    | 'sent'
    | 'confirmed'
    | 'converted'
    | 'in-production'
    | 'delivered'
    | 'cancelled'
   

  // Liens documents
  proformaId?: string;
  sourceProformaId?: string;
  proformaNumber?: string;
  invoiceId?: string | null;
  fromSimulationId?: string;
  simulationId?: string | null;

  // Ancien format
  dishes?: OrderDish[];

  // Nouveau format commercial
  items?: OrderItem[];

  // Ingrédients
  additionalIngredients?: OrderIngredient[];

  // Données opérationnelles
  operationalDishes?: OperationalDish[];
  operationalAdditionalIngredients?: OperationalIngredient[];
  operationalCosts?: OperationalCosts;

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
  numberOfGuests?: number;
  guests?: number;
  pax?: number;
  comment?: string;
  instructions?: string;

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

  // Infos terrain
  lieu?: string;
  heureLivraison?: string;
  contactSurSite?: string;
  telephoneContact?: string;

  // Dates système
  createdAt?: string | Date | any;
  updatedAt?: string | Date | any;
  confirmedAt?: string | Date | any;

  invoiceDate?: string;
  paymentDate?: string;
}

/* =========================
   PROPS
========================= */

export type DishDetailsProps = {
  dish: Dish;
  onClose: () => void;
};

export interface OrderDetailsProps {
  order: Order;
  onClose: () => void;
  onUpdated?: () => void;
}

export interface OrderFormProps {
  order?: Order;
  onClose: () => void;
  onSubmit: (
    values: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> &
      Record<string, any>
  ) => void | Promise<void>;
}

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
  onSubmit: (
    values: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>
  ) => void;
}

/* =========================
   UTILS
========================= */

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