const admin = require('firebase-admin');
const fs = require('fs');

admin.initializeApp({
  credential: admin.credential.cert(require('./tokeyproject-firebase-adminsdk-fbsvc-b84483117d.json')),
});

const db = admin.firestore();

const clients = JSON.parse(fs.readFileSync('./clients.json', 'utf8'));

function clean(value) {
  if (value === '' || value === null || value === undefined) return undefined;
  return value;
}

async function upsertClient(c) {
  const phone = c.phone ? String(c.phone) : null;
  const email = clean(c.email) || clean(c.societe);

  let queryRef = null;

  if (phone) {
    queryRef = db.collection('clients').where('phone', '==', phone).limit(1);
  } else if (email) {
    queryRef = db.collection('clients').where('email', '==', email).limit(1);
  }

  let existingDoc = null;

  if (queryRef) {
    const snap = await queryRef.get();
    if (!snap.empty) {
      existingDoc = snap.docs[0];
    }
  }

  const fullName = `${c.prenom ?? ''} ${c.name ?? ''}`.trim();

  const payload = {
    name: fullName || 'Client sans nom',
    phone,
    email,
    address: clean(c.adress) || '',
    notes: clean(`${c.civilite ?? ''} - ${c.group_client ?? ''}`),
    totalOrders: admin.firestore.FieldValue.increment(0),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  // Nettoyage des undefined
  Object.keys(payload).forEach(
    (k) => payload[k] === undefined && delete payload[k]
  );

  if (existingDoc) {
    // 🔁 UPDATE
    await existingDoc.ref.update(payload);
    console.log(`🔄 Updated: ${payload.name}`);
  } else {
    // ➕ CREATE
    await db.collection('clients').add({
      ...payload,
      totalOrders: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`➕ Created: ${payload.name}`);
  }
}

async function run() {
  for (const c of clients) {
    await upsertClient(c);
  }
  console.log('✅ Import clients terminé (upsert)');
}

run().catch(console.error);
