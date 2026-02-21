import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  memoryLocalCache,
  Firestore,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAX36VChlxdx6DltY5mPAnK9qYxyIif9g4",
  authDomain: "tokeyproject.firebaseapp.com",
  projectId: "tokeyproject",
  storageBucket: "tokeyproject.appspot.com",
  messagingSenderId: "212272618971",
  appId: "1:212272618971:web:8495015b2c115cf8895bfe",
  measurementId: "G-YYV92PXNMQ",
};

// ✅ Empêche double initialisation Firebase
const app =
  getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApp();

// ✅ On type explicitement Firestore
let db: Firestore;

try {
  db = initializeFirestore(app, {
    localCache: memoryLocalCache(),
  });
} catch (e) {
  db = getFirestore(app);
}

// Other services
// export const auth = getAuth(app);
export const storage = getStorage(app);

export { db };
export default app;