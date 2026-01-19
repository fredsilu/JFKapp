import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy as firestoreOrderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Ingredient, Dish, Order, Client } from '@/types';

type CollectionName = 'ingredients' | 'dishes' | 'orders' | 'clients';

interface UseFirestoreOptions<T> {
  where?: [string, '==' | '!=' | '>' | '<' | '>=' | '<=', any];
  orderBy?: [keyof T, 'asc' | 'desc'];
}

export function useFirestore<T>(
  collectionName: CollectionName,
  options: UseFirestoreOptions<T> = {}
) {
  const [data, setData] = useState<T[]>([]);  // Initialize with empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const colRef = collection(db, collectionName);
    let q = query(colRef);
    
    if (options.where) {
      q = query(q, where(...options.where));
    }
    
    if (options.orderBy) {
      q = query(q, firestoreOrderBy(options.orderBy[0] as string, options.orderBy[1]));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => {
          const data = doc.data();
          // Convert Timestamps to Dates
          if (data.createdAt) {
            data.createdAt = data.createdAt.toDate();
          }
          if (data.updatedAt) {
            data.updatedAt = data.updatedAt.toDate();
          }
          if (data.scheduledFor) {
            data.scheduledFor = data.scheduledFor.toDate();
          }
          return {
            id: doc.id,
            ...data,
          };
        }) as T[];
        setData(items);
        setLoading(false);
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, JSON.stringify(options)]);

  return { data, loading, error };
}

// Typed hooks for each collection
export function useIngredients(options?: UseFirestoreOptions<Ingredient>) {
  return useFirestore<Ingredient>('ingredients', options);
}

export function useDishes(options?: UseFirestoreOptions<Dish>) {
  return useFirestore<Dish>('dishes', options);
}

export function useOrders(options?: UseFirestoreOptions<Order>) {
  return useFirestore<Order>('orders', options);
}

export function useClients(options?: UseFirestoreOptions<Client>) {
  return useFirestore<Client>('clients', options);
}