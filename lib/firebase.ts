// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";

import {
  initializeFirestore,
  getFirestore,
  memoryLocalCache,
  Firestore,
} from "firebase/firestore";

import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

export const APP_ENV =
  process.env.EXPO_PUBLIC_APP_ENV || "test";

export const IS_TEST = APP_ENV === "test";
export const IS_DEVELOPMENT =
  APP_ENV === "development" || APP_ENV === "developpement";
export const IS_PRODUCTION = APP_ENV === "production";

export const DOCUMENT_PREFIX =
  process.env.EXPO_PUBLIC_DOCUMENT_PREFIX || "";

const PROJECT_ID =
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "";

const PROD_PROJECT_ID = "jfkapp-production";
const TEST_PROJECT_ID = "tokeyproject";

if (!PROJECT_ID) {
  throw new Error(
    "Firebase PROJECT_ID manquant. Vérifie ton fichier .env."
  );
}

if (!IS_PRODUCTION && PROJECT_ID === PROD_PROJECT_ID) {
  throw new Error(
    `SECURITE BLOQUANTE: APP_ENV=${APP_ENV} utilise Firebase PROD (${PROJECT_ID}).`
  );
}

if (IS_PRODUCTION && PROJECT_ID !== PROD_PROJECT_ID) {
  throw new Error(
    `SECURITE BLOQUANTE: APP_ENV=production n'utilise pas Firebase PROD. Projet actuel: ${PROJECT_ID}`
  );
}

if ((IS_TEST || IS_DEVELOPMENT) && PROJECT_ID !== TEST_PROJECT_ID) {
  throw new Error(
    `SECURITE BLOQUANTE: APP_ENV=${APP_ENV} doit utiliser Firebase TEST (${TEST_PROJECT_ID}). Projet actuel: ${PROJECT_ID}`
  );
}

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId:
    process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app =
  getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApp();

let db: Firestore;

try {
  db = initializeFirestore(app, {
    localCache: memoryLocalCache(),
  });
} catch {
  db = getFirestore(app);
}

export const auth = getAuth(app);
export const storage = getStorage(app);

console.log("===== JFKAPP FIREBASE ENV =====");
console.log("APP_ENV:", APP_ENV);
console.log("PROJECT_ID:", PROJECT_ID);
console.log("DOCUMENT_PREFIX:", DOCUMENT_PREFIX);
console.log("IS_TEST:", IS_TEST);
console.log("IS_PRODUCTION:", IS_PRODUCTION);
console.log("================================");

export { db };
export default app;