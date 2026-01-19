const admin = require('firebase-admin');
const fs = require('fs');

admin.initializeApp({
  credential: admin.credential.cert(require('./tokeyproject-firebase-adminsdk-fbsvc-b84483117d.json')),
});

const db = admin.firestore();
const dishes = JSON.parse(fs.readFileSync('./plats.json', 'utf8'));

function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// 🔹 Charger tous les ingrédients Firestore
async function loadIngredientsIndex() {
  const snap = await db.collection('ingredients').get();
  const index = {};

  snap.forEach(doc => {
    const data = doc.data();
    index[normalize(data.name)] = {
      id: doc.id,
      name: data.name,
      unit: data.unit,
      price: data.price,
    };
  });

  return index;
}

async function upsertDishes() {
  const ingredientIndex = await loadIngredientsIndex();
  let errors = [];

  for (const dish of dishes) {
    const dishName = dish.nom.trim();

    const ingredients = [];

    for (const ing of dish.listeIngredients) {
      const key = normalize(ing.nom);

      if (!ingredientIndex[key]) {
        errors.push({
          dish: dishName,
          ingredient: ing.nom,
        });
        continue;
      }

      ingredients.push({
        ingredientId: ingredientIndex[key].id,
        name: ingredientIndex[key].name,
        unit: ing.unite,
        quantity: Number(ing.quantite),
        cost: Number(ing.couttotalingredient),
      });
    }

    if (ingredients.length === 0) {
      console.warn(`⚠️ Plat ignoré (aucun ingrédient valide): ${dishName}`);
      continue;
    }

    // 🔍 Vérifier si le plat existe déjà
    const existing = await db
      .collection('dishes')
      .where('name', '==', dishName)
      .limit(1)
      .get();

    const payload = {
      name: dishName,
      description: dish.description || '',
      ingredients,
      unitCost: Number(
        String(dish['cout unitaire ($)']).replace(',', '.').replace('=', '')
      ),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!existing.empty) {
      await existing.docs[0].ref.update(payload);
      console.log(`🔄 Updated dish: ${dishName}`);
    } else {
      await db.collection('dishes').add({
        ...payload,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`➕ Created dish: ${dishName}`);
    }
  }

  if (errors.length) {
    console.log('\n❌ INGREDIENTS MANQUANTS :');
    errors.forEach(e =>
      console.log(`- ${e.ingredient} (plat: ${e.dish})`)
    );
  } else {
    console.log('\n✅ Tous les ingrédients sont cohérents');
  }
}

upsertDishes().catch(console.error);
