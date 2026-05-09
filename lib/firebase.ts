import { initializeApp, getApps, getApp } from 'firebase/app';

import {
  initializeFirestore,
  getFirestore,
  memoryLocalCache,
  Firestore,
} from 'firebase/firestore';

import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// ===============================
// ENV VARIABLES
// ===============================

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,

  // facultatif
  measurementId:
    process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// ===============================
// FIREBASE APP
// ===============================

const app =
  getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApp();

// ===============================
// FIRESTORE
// ===============================

let db: Firestore;

try {
  db = initializeFirestore(app, {
    localCache: memoryLocalCache(),
  });
} catch (e) {
  db = getFirestore(app);
}

// ===============================
// SERVICES
// ===============================

export const auth = getAuth(app);
export const storage = getStorage(app);

// ===============================
// ENVIRONMENT
// ===============================

export const APP_ENV =
  process.env.EXPO_PUBLIC_APP_ENV || 'test';

export const IS_TEST =
  APP_ENV === 'test';

export const IS_PRODUCTION =
  APP_ENV === 'production';

export const DOCUMENT_PREFIX =
  process.env.EXPO_PUBLIC_DOCUMENT_PREFIX || '';

// ===============================
// EXPORTS
// ===============================

console.log('APP_ENV:', APP_ENV);
console.log('IS_TEST:', IS_TEST);
console.log('IS_PRODUCTION:', IS_PRODUCTION);
console.log(process.env.EXPO_PUBLIC_APP_ENV);

export { db };
export default app;