import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function escapeCsv(value: any) {
  if (value === undefined || value === null) return "";
  return `"${String(value).replace(/"/g, '""')}"`;
}

async function exportIngredients() {
  const snapshot = await getDocs(collection(db, "ingredients"));

  const rows = snapshot.docs.map((docSnap) => {
    const data = docSnap.data();

    return {
      id: docSnap.id,
      name: data.name ?? "",
      category: data.category ?? "",
      unit: data.unit ?? "",
      unitPrice: data.unitPrice ?? "",
      currency: data.currency ?? "USD",
      supplier: data.supplier ?? "",
      isActive: data.isActive ?? true,
    };
  });

  fs.mkdirSync("exports", { recursive: true });

  fs.writeFileSync(
    "exports/ingredients.json",
    JSON.stringify(rows, null, 2),
    "utf8"
  );

  const csvHeader = [
    "id",
    "name",
    "category",
    "unit",
    "unitPrice",
    "currency",
    "supplier",
    "isActive",
  ];

  const csvRows = rows.map((row) =>
    csvHeader.map((key) => escapeCsv((row as any)[key])).join(",")
  );

  fs.writeFileSync(
    "exports/ingredients.csv",
    [csvHeader.join(","), ...csvRows].join("\n"),
    "utf8"
  );

  console.log(`✅ Export terminé : ${rows.length} ingrédients exportés`);
  console.log("📄 exports/ingredients.json");
  console.log("📄 exports/ingredients.csv");
}

exportIngredients().catch((error) => {
  console.error("❌ Erreur export ingredients:", error);
  process.exit(1);
});