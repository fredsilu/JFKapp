// Client types
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
  totalOrders: number;
  lastOrderDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  profilePicture?: string; // URL to the profile picture
}

// Ingredient types
export interface Ingredient {
  id: string;
  name: string;
  price: number;
  unit: string;
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
  dish: Dish;
  quantity: number;
}

export interface OrderIngredient {
  ingredient: Ingredient;
  quantity: number;
}

export interface Order {
  id: string;
  clientId: string;
  client: Client;
  status: 'En cours' | 'En préparation' | 'Livré';
  dishes: OrderDish[];
  additionalIngredients: OrderIngredient[];
  deliveryTime: string;
  address: string;
  createdAt: string;
  updatedAt?: Date;
}