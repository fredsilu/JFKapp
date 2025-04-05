import { initializeApp } from 'firebase/app';
//import { getAuth } from 'firebase/auth';
import { getFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAX36VChlxdx6DltY5mPAnK9qYxyIif9g4",
  authDomain: "tokeyproject.firebaseapp.com",
  projectId: "tokeyproject",
  storageBucket: "tokeyproject.appspot.com", // Fixed storage bucket URL
  messagingSenderId: "212272618971",
  appId: "1:212272618971:web:8495015b2c115cf8895bfe",
  measurementId: "G-YYV92PXNMQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
//export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enable Firestore offline persistence
try {
  const { enableIndexedDbPersistence } = require('firebase/firestore');
  interface FirestoreError extends Error {
    code: string;
  }

  enableIndexedDbPersistence(db).catch((err: FirestoreError) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.warn('Firebase persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      // The current browser doesn't support persistence
      console.warn('Firebase persistence not supported in this environment');
    }
  });
} catch (error) {
  // Ignore error in environments where IndexedDB is not available
}

export default app;