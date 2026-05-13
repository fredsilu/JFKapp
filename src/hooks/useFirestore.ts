// src/hooks/useFirestore.ts
import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy as firestoreOrderBy,
  where,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { Ingredient, Dish, Order, Client } from '@/types';

type CollectionName = 'ingredients' | 'dishes' | 'orders' | 'clients';

interface UseFirestoreOptions<T> {
  where?: [string, '==' | '!=' | '>' | '<' | '>=' | '<=', any];
  orderBy?: [keyof T, 'asc' | 'desc'];
}

function safeDate(value: any): Date | null {
  if (!value) return null;

  if (value instanceof Date) return value;

  if (typeof value?.toDate === 'function') {
    return value.toDate();
  }

  return null;
}

export function useFirestore<T>(
  collectionName: CollectionName,
  options: UseFirestoreOptions<T> = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const colRef = collection(db, collectionName);
    const constraints = [];

    if (options.where) {
      constraints.push(where(...options.where));
    }

    if (options.orderBy) {
      constraints.push(
        firestoreOrderBy(options.orderBy[0] as string, options.orderBy[1])
      );
    }

    const q = query(colRef, ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => {
          const docData = docSnap.data();

          return {
            id: docSnap.id,
            ...docData,

            createdAt: safeDate(docData.createdAt),
            updatedAt: safeDate(docData.updatedAt),
            scheduledFor: safeDate(docData.scheduledFor),
          };
        }) as T[];

        setData(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Error loading ${collectionName}:`, err);
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