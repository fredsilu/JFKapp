require("dotenv").config();
const XLSX = require("xlsx");
const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
} = require("firebase/firestore");

/**
 * Reprends exactement la config de ton lib/firebase.ts
 */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const OUTPUT_FILE =
  "B:/Professionnel/Creperie/Clientele/Archives_Crepolia/clients_export.xlsx";

async function main() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const q = query(
    collection(db, "clients"),
    orderBy("name")
  );

  const snapshot = await getDocs(q);

  const rows = snapshot.docs.map((doc) => {
    const data = doc.data();

    return {
      clientId: doc.id,
      clientName: data.name || "",
      email: data.email || "",
      phone: data.phone || "",
      city: data.city || "",
    };
  });

  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(rows),
    "clients"
  );

  XLSX.writeFile(wb, OUTPUT_FILE);

  console.log(`Clients exportés : ${rows.length}`);
  console.log(`Fichier : ${OUTPUT_FILE}`);
}

main().catch(console.error);