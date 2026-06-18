// src/hooks/useFirestore.ts
import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy as firestoreOrderBy,
  where,
  QueryConstraint,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { Ingredient, Dish, Order, Client } from '@/types';

type CollectionName =
  | "ingredients"
  | "dishes"
  | "orders"
  | "clients"
  | "catering_invoices";

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

  const whereOption = useMemo(
    () => options.where,
    [JSON.stringify(options.where)]
  );

  const orderByOption = useMemo(
    () => options.orderBy,
    [JSON.stringify(options.orderBy)]
  );

  useEffect(() => {
    setLoading(true);

    const colRef = collection(db, collectionName);
    const constraints: QueryConstraint[] = [];

    if (whereOption) {
      constraints.push(where(...whereOption));
    }

    if (orderByOption) {
      constraints.push(
        firestoreOrderBy(orderByOption[0] as string, orderByOption[1])
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
  }, [collectionName, whereOption, orderByOption]);

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

export function useInvoices(options?: UseFirestoreOptions<any>) {
  return useFirestore<any>("catering_invoices", options);
}