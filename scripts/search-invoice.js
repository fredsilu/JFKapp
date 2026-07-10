const admin = require("firebase-admin");
const path = require("path");

const SERVICE_ACCOUNT_PATH = path.resolve("serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(require(SERVICE_ACCOUNT_PATH)),
});

const db = admin.firestore();

const NUMBER = process.argv[2];

if (!NUMBER) {
  console.log("Utilisation :");
  console.log("node scripts/search-invoice.js \"facture_CR2025_FC_141\"");
  process.exit(1);
}

async function main() {
  const snap = await db
    .collection("archived_documents")
    .where("number", "==", NUMBER)
    .get();

  console.log("--------------------------------");
  console.log("Recherche :", NUMBER);
  console.log("Résultats :", snap.size);
  console.log("--------------------------------");

  snap.forEach((doc) => {
    const data = doc.data();

    console.log({
      id: doc.id,
      number: data.number,
      type: data.type,
      client: data.clientName,
      fileName: data.fileName,
      storagePath: data.storagePath,
      pdfUrl: data.pdfUrl,
    });
  });
}

main().catch(console.error);