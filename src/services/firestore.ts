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

export async function updateOrderStatus(orderId: string, status: Order['status']) {
  const docRef = doc(db, COLLECTIONS.ORDERS, orderId);
  const now = Timestamp.now();
  await updateDoc(docRef, {
    status,
    updatedAt: now,
  });
}