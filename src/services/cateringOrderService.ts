// src/services/cateringOrderService.ts
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';

import { CateringOrder } from '@/types/catering';

import { getSimulationById } from '@/src/services/cateringSimulation.service';

import { buildDocumentItemsFromSimulation } from '@/src/utils/buildDocumentItemsFromSimulation';
import { calculateDocumentTotals } from '@/src/services/calculateDocumentTotals';

const COLLECTION = 'orders';
function findUndefinedPaths(obj: any, path = ''): string[] {
  const results: string[] = [];

  if (obj === undefined) {
    results.push(path || 'root');
    return results;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      results.push(...findUndefinedPaths(item, `${path}[${index}]`));
    });
    return results;
  }

  if (obj !== null && typeof obj === 'object') {
    Object.entries(obj).forEach(([key, value]) => {
      const nextPath = path ? `${path}.${key}` : key;
      results.push(...findUndefinedPaths(value, nextPath));
    });
  }

  return results;
}

function cleanUndefinedValues<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .map((item) => cleanUndefinedValues(item))
      .filter((item) => item !== undefined) as T;
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, any>)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, cleanUndefinedValues(v)])
    ) as T;
  }

  return value;
}

/* =========================================
   CREATE PROFORMA FROM SIMULATION
========================================= */
export async function createProformaFromSimulation(simulationId: string) {
  const simulation = await getSimulationById(simulationId);

  if (!simulation) {
    throw new Error('Simulation introuvable');
  }

  const items = buildDocumentItemsFromSimulation(simulation);
  const totals = calculateDocumentTotals(items);

  const proforma: Omit<CateringOrder, 'id'> = {
    simulationId,

    documentType: 'proforma',
    status: 'draft',

    number: `PF-${Date.now()}`,
    version: 1,

    name: simulation.name ?? 'Commande traiteur',

    clientId: simulation.clientId,

    client: {
      name: '',
    },

    designation: simulation.designation ?? '',

    dateLivraison: simulation.dateLivraison ?? '',
    deliveryDate: simulation.dateLivraison ?? '',

    deliveryAddress: simulation.deliveryAddress ?? '',
    address: simulation.deliveryAddress ?? '',

    deliveryTime: simulation.deliveryTime ?? '',

    guestCount: simulation.guestCount ?? 0,
    numberOfGuests: simulation.guestCount ?? 0,

    comment: simulation.comment ?? '',

    items,
    totals,

    breakfast: simulation.breakfast ?? null,
    lunch: simulation.lunch ?? null,
    drinks: simulation.drinks ?? null,
    service: simulation.service ?? null,

    dishes: [],
    additionalIngredients: [],
    operationalDishes: [],
    operationalAdditionalIngredients: [],
    operationalCosts: {
      dishesCost: 0,
      additionalIngredientsCost: 0,
      totalProductionCost: 0,
    },

    billedAmount:
      totals?.subtotal ??
      totals?.total ??
      simulation.globalTurnover ??
      0,

    pricingReference: {
      totalHT: simulation.globalTurnover ?? 0,
      totalCost: simulation.globalCost ?? 0,
      margin: simulation.globalMargin ?? 0,
    },

    invoiceId: null,

    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
  } as any;

  const ref = await addDoc(
    collection(db, COLLECTION),
    cleanUndefinedValues(proforma)
  );

  return ref.id;
}

/* =========================================
   GET ALL PROFORMAS
========================================= */
export async function getProformas() {
  const q = query(
    collection(db, COLLECTION),
    where('documentType', '==', 'proforma')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as CateringOrder[];
}

/* =========================================
   GET ALL ORDERS
========================================= */
export async function getOrders() {
  const q = query(
    collection(db, COLLECTION),
    where('documentType', '==', 'order')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as CateringOrder[];
}

/* =========================================
   GET ORDER / PROFORMA BY ID
========================================= */
export async function getOrderById(id: string): Promise<CateringOrder | null> {
  if (!id) return null;

  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...(snap.data() as Omit<CateringOrder, 'id'>),
  };
}

/* =========================================
   UPDATE ORDER
========================================= */
export async function updateOrder(
  orderId: string,
  data: Partial<CateringOrder> & Record<string, any>
) {
  if (!orderId) {
    throw new Error('Identifiant de commande manquant');
  }

  const ref = doc(db, COLLECTION, orderId);

  const deliveryDateValue =
    data.deliveryDate ??
    data.dateLivraison ??
    '';

  const deliveryAddressValue =
    data.deliveryAddress ??
    data.address ??
    '';

  const guestCountValue =
    data.guestCount ??
    data.numberOfGuests ??
    0;

  const billedAmountValue =
    data.billedAmount ??
    data.totals?.subtotal ??
    data.totals?.total ??
    data.pricingReference?.totalHT ??
    0;

  const payload = cleanUndefinedValues({
    ...data,

    dishes: data.dishes ?? [],
    additionalIngredients: data.additionalIngredients ?? [],

    operationalDishes: data.operationalDishes ?? [],
    operationalAdditionalIngredients:
      data.operationalAdditionalIngredients ?? [],

    operationalCosts: data.operationalCosts ?? {
      dishesCost: 0,
      additionalIngredientsCost: 0,
      totalProductionCost: 0,
    },

    deliveryDate: deliveryDateValue,
    dateLivraison: deliveryDateValue,

    deliveryAddress: deliveryAddressValue,
    address: deliveryAddressValue,

    guestCount: guestCountValue,
    numberOfGuests: guestCountValue,

    billedAmount: billedAmountValue,

    updatedAt: serverTimestamp(),
  } as any);

  const undefinedPaths = findUndefinedPaths(payload);

  if (undefinedPaths.length > 0) {
    console.log('❌ Champs undefined détectés dans updateOrder:', undefinedPaths);
    throw new Error(
      `Champs undefined détectés: ${undefinedPaths.join(', ')}`
    );
  }

  await updateDoc(ref, payload);


}

/* =========================================
   CONFIRM ORDER
========================================= */
export async function confirmOrder(orderId: string) {
  if (!orderId) {
    throw new Error('Identifiant de commande manquant');
  }

  const ref = doc(db, COLLECTION, orderId);

  await updateDoc(ref, {
    documentType: 'order',
    status: 'confirmed',
    confirmedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/* =========================================
   CREATE ORDER FROM PROFORMA
========================================= */
export async function createOrderFromProforma(proforma: any) {
  if (!proforma?.id) {
    throw new Error('Proforma invalide');
  }

  const deliveryDateValue =
    proforma.deliveryDate ??
    proforma.dateLivraison ??
    proforma.eventDate ??
    '';

  const deliveryAddressValue =
    proforma.deliveryAddress ??
    proforma.address ??
    proforma.eventLocation ??
    '';

  const guestCountValue =
    proforma.guestCount ??
    proforma.numberOfGuests ??
    0;

  const billedAmountValue =
    proforma.billedAmount ??
    proforma.totals?.subtotal ??
    proforma.totals?.total ??
    proforma.pricingReference?.totalHT ??
    0;

  const order: Omit<CateringOrder, 'id'> = {
    simulationId: proforma.simulationId ?? null,

    documentType: 'order',
    status: 'En cours',

    number: `CMD-${Date.now()}`,
    version: 1,

    name: proforma.name ?? proforma.eventName ?? 'Commande traiteur',

    clientId: proforma.clientId ?? '',

    client: proforma.client ?? {
      name: proforma.clientName ?? '',
    },

    designation: proforma.designation ?? '',

    dateLivraison: deliveryDateValue,
    deliveryDate: deliveryDateValue,

    deliveryAddress: deliveryAddressValue,
    address: deliveryAddressValue,

    deliveryTime: proforma.deliveryTime ?? proforma.eventTime ?? '',

    guestCount: guestCountValue,
    numberOfGuests: guestCountValue,

    comment: proforma.comment ?? '',

    items: proforma.items ?? [],

    dishes: proforma.dishes ?? [],
    additionalIngredients: proforma.additionalIngredients ?? [],

    operationalDishes: proforma.operationalDishes ?? [],
    operationalAdditionalIngredients:
      proforma.operationalAdditionalIngredients ?? [],

    operationalCosts: proforma.operationalCosts ?? {
      dishesCost: 0,
      additionalIngredientsCost: 0,
      totalProductionCost: 0,
    },

    totals: proforma.totals ?? {
      subtotal: 0,
      total: 0,
      currency: 'USD',
    },

    billedAmount: billedAmountValue,

    breakfast: proforma.breakfast ?? null,
    lunch: proforma.lunch ?? null,
    drinks: proforma.drinks ?? null,
    service: proforma.service ?? null,

    pricingReference: proforma.pricingReference ?? {
      totalHT: proforma.totals?.subtotal ?? 0,
      totalCost: 0,
      margin: 0,
    },

    invoiceId: null,

    proformaId: proforma.id,
    proformaNumber: proforma.number ?? '',

    confirmedAt: serverTimestamp() as any,

    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
  } as any;

  const ref = await addDoc(
    collection(db, COLLECTION),
    cleanUndefinedValues(order)
  );

  return {
    id: ref.id,
    ...order,
  };
}

/* =========================================
   UPDATE ORDER STATUS
========================================= */
export async function updateOrderStatus(
  orderId: string,
  status: CateringOrder['status']
) {
  if (!orderId) {
    throw new Error('Identifiant de commande manquant');
  }

  const ref = doc(db, COLLECTION, orderId);

  await updateDoc(ref, {
    status,
    updatedAt: serverTimestamp(),
  });
}