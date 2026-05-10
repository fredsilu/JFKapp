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
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import { CateringOrder } from "@/types/catering";

import { getSimulationById } from "@/src/services/cateringSimulation.service";

import { buildDocumentItemsFromSimulation } from "@/src/utils/buildDocumentItemsFromSimulation";
import { calculateDocumentTotals } from "@/src/services/calculateDocumentTotals";

const COLLECTION = "orders";

/* =========================================
   CREATE PROFORMA FROM SIMULATION
========================================= */
export async function createProformaFromSimulation(simulationId: string) {
  const simulation = await getSimulationById(simulationId);

  if (!simulation) {
    throw new Error("Simulation introuvable");
  }

  const items = buildDocumentItemsFromSimulation(simulation);
  const totals = calculateDocumentTotals(items);

  const proforma: Omit<CateringOrder, "id"> = {
    simulationId,

    documentType: "proforma",
    status: "draft",

    number: `PF-${Date.now()}`,
    version: 1,

    name: simulation.name ?? "Commande traiteur",

    clientId: simulation.clientId,

    client: {
      name: "",
    },

    designation: simulation.designation ?? "",

    dateLivraison: simulation.dateLivraison,
    deliveryAddress: simulation.deliveryAddress,
    deliveryTime: simulation.deliveryTime,

    guestCount: simulation.guestCount,

    comment: simulation.comment,

    items,
    totals,

    breakfast: simulation.breakfast,
    lunch: simulation.lunch,
    drinks: simulation.drinks,
    service: simulation.service,

    pricingReference: {
      totalHT: simulation.globalTurnover ?? 0,
      totalCost: simulation.globalCost ?? 0,
      margin: simulation.globalMargin ?? 0,
    },

    invoiceId: null,

    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
  } as any;

  const ref = await addDoc(collection(db, COLLECTION), proforma);

  return ref.id;
}

/* =========================================
   GET ALL PROFORMAS
========================================= */
export async function getProformas() {
  const q = query(
    collection(db, COLLECTION),
    where("documentType", "==", "proforma")
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
    where("documentType", "==", "order")
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
export async function getOrderById(
  id: string
): Promise<CateringOrder | null> {
  const ref = doc(db, COLLECTION, id);

  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...(snap.data() as Omit<CateringOrder, "id">),
  };
}

/* =========================================
   UPDATE ORDER
========================================= */
export async function updateOrder(
  orderId: string,
  data: Partial<CateringOrder>
) {
  const ref = doc(db, COLLECTION, orderId);

  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/* =========================================
   CONFIRM ORDER
========================================= */
export async function confirmOrder(orderId: string) {
  const ref = doc(db, COLLECTION, orderId);

  await updateDoc(ref, {
    documentType: "order",
    status: "confirmed",
    confirmedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/* =========================================
   CREATE ORDER FROM PROFORMA
========================================= */
export async function createOrderFromProforma(proforma: any) {
  if (!proforma?.id) {
    throw new Error("Proforma invalide");
  }

  const order: Omit<CateringOrder, "id"> = {
    simulationId: proforma.simulationId ?? null,

    documentType: "order",
    status: "draft",

    number: `CMD-${Date.now()}`,
    version: 1,

    name: proforma.name ?? proforma.eventName ?? "Commande traiteur",

    clientId: proforma.clientId ?? "",

    client: {
      name: proforma.clientName ?? proforma.client?.name ?? "",
    },

    designation: proforma.designation ?? "",

    dateLivraison: proforma.eventDate ?? proforma.dateLivraison ?? "",

    deliveryAddress: proforma.deliveryAddress ?? "",
    deliveryTime: proforma.deliveryTime ?? "",

    guestCount: proforma.guestCount ?? 0,

    comment: proforma.comment ?? "",

    items: proforma.items ?? [],

    totals: proforma.totals ?? {
      subtotal: 0,
      total: 0,
      currency: "USD",
    },

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
    proformaNumber: proforma.number ?? "",

    confirmedAt: serverTimestamp() as any,

    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
  } as any;

  const ref = await addDoc(collection(db, COLLECTION), order);

  return {
    id: ref.id,
    ...order,
  };
}