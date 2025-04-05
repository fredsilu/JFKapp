import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Ingredient, Dish, Order, Client } from '@/types';

// Collection references
const COLLECTIONS = {
  INGREDIENTS: 'ingredients',
  DISHES: 'dishes',
  ORDERS: 'orders',
  CLIENTS: 'clients',
} as const;

// Orders
export async function getOrders() {
  const snapshot = await getDocs(collection(db, COLLECTIONS.ORDERS));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  } as Order));
}

export async function addOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = Timestamp.now();
  const docRef = await addDoc(collection(db, COLLECTIONS.ORDERS), {
    ...order,
    createdAt: now,
    updatedAt: now,
  });
  return {
    id: docRef.id,
    ...order,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  };
}

export async function updateOrder(orderId: string, order: Partial<Order>) {
  const docRef = doc(db, COLLECTIONS.ORDERS, orderId);
  const now = Timestamp.now();
  await updateDoc(docRef, {
    ...order,
    updatedAt: now,
  });
}

export async function updateOrderStatus(orderId: string, status: Order['status']) {
  const docRef = doc(db, COLLECTIONS.ORDERS, orderId);
  const now = Timestamp.now();
  await updateDoc(docRef, {
    status,
    updatedAt: now,
  });
}

// Ingredients
export async function addIngredient(ingredient: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = Timestamp.now();
  const docRef = await addDoc(collection(db, COLLECTIONS.INGREDIENTS), {
    ...ingredient,
    createdAt: now,
    updatedAt: now,
  });
  return {
    id: docRef.id,
    ...ingredient,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  };
}

export async function updateIngredient(ingredientId: string, ingredient: Partial<Ingredient>) {
  const docRef = doc(db, COLLECTIONS.INGREDIENTS, ingredientId);
  const now = Timestamp.now();
  await updateDoc(docRef, {
    ...ingredient,
    updatedAt: now,
  });
}

// Dishes
export async function addDish(dish: Omit<Dish, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = Timestamp.now();
  const docRef = await addDoc(collection(db, COLLECTIONS.DISHES), {
    ...dish,
    createdAt: now,
    updatedAt: now,
  });
  return {
    id: docRef.id,
    ...dish,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  };
}

export async function updateDish(dishId: string, dish: Partial<Dish>) {
  const docRef = doc(db, COLLECTIONS.DISHES, dishId);
  const now = Timestamp.now();
  await updateDoc(docRef, {
    ...dish,
    updatedAt: now,
  });
}

// Clients
export async function addClient(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'totalOrders'>) {
  const now = Timestamp.now();
  const docRef = await addDoc(collection(db, COLLECTIONS.CLIENTS), {
    ...client,
    totalOrders: 0,
    createdAt: now,
    updatedAt: now,
  });
  return {
    id: docRef.id,
    ...client,
    totalOrders: 0,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  };
}

export async function updateClient(clientId: string, client: Partial<Client>) {
  const docRef = doc(db, COLLECTIONS.CLIENTS, clientId);
  const now = Timestamp.now();
  await updateDoc(docRef, {
    ...client,
    updatedAt: now,
  });
}