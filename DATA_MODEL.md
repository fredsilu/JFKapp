# DATA MODEL — JFKApp

Document concis décrivant les collections Firestore, les champs, relations, exemples et recommandations pour le développeur qui reprend le projet.

---

## Règles générales
- Les timestamps sont stockés en Firestore comme `Timestamp` (côté client le code convertit en `Date`).
- La persistance offline est activée dans `lib/firebase.ts` (IndexedDB) — attention au support Web/Electron.
- Les images sont stockées dans Firebase Storage; seules les URLs (`string`) sont conservées dans les documents.

## Emplacement du code lié au modèle
- Initialisation Firebase: `lib/firebase.ts`
- CRUD Firestore: `src/services/firestore.ts`
- Uploads Storage: `src/services/storage.ts`
- Types TypeScript: `types/index.ts`

---

## Collections

### `clients`
Champs:
- `id` (string) — identifiant du document (doc.id)
- `name` (string) — nom du client
- `email` (string)
- `phone` (string)
- `address` (string)
- `notes` (string, optional)
- `totalOrders` (number) — compteur (init à 0)
- `lastOrderDate` (Timestamp | Date, optional)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)
- `profilePicture` (string, optional) — URL de l'image stockée dans Storage

Usage / remarques:
- `totalOrders` est mis à jour lors de la création d'une commande (logique à implémenter côté serveur ou via transaction client).
- Images recommandées stockées sous `clients/{clientId}/profile.jpg` (convention utilisée dans `src/services/storage.ts`).

Exemple de document:
```
{
  "name": "Jean Dupont",
  "email": "jean@example.com",
  "phone": "+33 6 00 00 00 00",
  "address": "12 rue Exemple, Paris",
  "totalOrders": 3,
  "createdAt": <Timestamp>,
  "updatedAt": <Timestamp>,
  "profilePicture": "https://.../clients/<id>/profile.jpg"
}
```

Index suggéré:
- `createdAt` (pour tri)

---

### `ingredients`
Champs:
- `id` (string)
- `name` (string)
- `price` (number)
- `unit` (string) — ex: "kg", "g", "unité"
- `quantity` (number) — quantité disponible (optionnel selon usage)
- `description` (string)
- `stock` (number)
- `category` (string)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

Exemple:
```
{
  "name": "Tomate",
  "price": 0.5,
  "unit": "pièce",
  "quantity": 100,
  "description": "Tomate fraîche",
  "stock": 100,
  "category": "Légumes",
  "createdAt": <Timestamp>
}
```

Index suggéré:
- `name` (recherche)
- `category`

---

### `dishes` (plats)
Champs:
- `id` (string)
- `name` (string)
- `description` (string)
- `image` (string) — URL
- `ingredients` (array of DishIngredient)
  - DishIngredient: `{ ingredient: <Ingredient object or ref>, quantity: number }`
- `preparationTime` (number, minutes)
- `servings` (number)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

Remarques:
- Les `ingredients` contiennent l'objet complet `Ingredient` selon `types/index.ts`. Alternativement, il est possible d'utiliser une référence (`doc(db, 'ingredients', id)`) pour réduire duplication et faciliter mises à jour.
- L'URL d'image est fournie par Storage après upload.

Exemple:
```
{
  "name": "Salade Niçoise",
  "description": "Salade classique",
  "image": "https://.../dishes/<id>/photo.jpg",
  "ingredients": [
    { "ingredient": { /* objet Ingredient */ }, "quantity": 2 },
  ],
  "preparationTime": 15,
  "servings": 2,
  "createdAt": <Timestamp>
}
```

Index suggéré:
- `name`
- `createdAt`

---

### `orders`
Champs:
- `id` (string)
- `clientId` (string) — id du client
- `client` (object Client) — copie embarquée du client (pratique pour affichage rapide)
- `status` (string) — valeurs: `'En cours' | 'En préparation' | 'Livré'`
- `dishes` (array of OrderDish)
  - OrderDish: `{ name: string, dish: <Dish object>, quantity: number, ingredients: DishIngredient[], additionalIngredients: DishIngredient[] }`
- `additionalIngredients` (array of OrderIngredient)
  - OrderIngredient: `{ ingredient: <Ingredient object>, quantity: number }`
- `deliveryAddress` (string)
- `deliveryTime` (string)
- `address` (string) — (duplication possible, vérifier usage)
- `createdAt` (Timestamp or string in types currently)
- `updatedAt` (Timestamp)

Remarques:
- `dishes` contient l'objet `dish` complet et liste d'ingrédients utilisés — utile pour historique immuable des prix et composition.
- Vérifier cohérence: `createdAt` dans `types` est `string` (probablement erroné) — standardiser sur `Timestamp`.

Exemple:
```
{
  "clientId": "abc123",
  "client": { /* copie du client */ },
  "status": "En cours",
  "dishes": [
    {
      "name": "Pizza Margherita",
      "dish": { /* objet Dish */ },
      "quantity": 2,
      "ingredients": [ /* liste DishIngredient */ ],
      "additionalIngredients": []
    }
  ],
  "additionalIngredients": [],
  "deliveryAddress": "12 rue Exemple",
  "deliveryTime": "12:30",
  "createdAt": <Timestamp>
}
```

Index suggéré:
- `createdAt` (tri par date)
- `status` (filtre commandes actives)
- `clientId` (recherche commandes par client)
- Composite possible: `status + createdAt` pour requêtes filtrées puis triées

---

## Storage (conventions)
- Profile images clients: `clients/{clientId}/profile.jpg` (implémenté dans `src/services/storage.ts`).
- Images plats: recommander `dishes/{dishId}/photo.jpg`.
- Les fonctions `uploadProfilePicture` renvoient l'URL à stocker dans le document.

## Sécurité & règles (recommandations)
- Utiliser Firebase Auth pour lier accès et règles Firestore.
- Exemple minimal de règle (pseudo) :
```
service cloud.firestore {
  match /databases/{database}/documents {
    match /clients/{clientId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.ownerId; // si owner
    }
    match /orders/{orderId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    // restreindre ingredients/dishes pour les éditeurs seulement
  }
}
```
- Protéger Storage pour empêcher écriture/publication non-autorisée.

## Notes / points d'attention pour le repreneur
- Standardiser `createdAt`/`updatedAt` comme `Timestamp` partout et convertir côté client.
- Considérer utiliser des `refs` à la place d'objets imbriqués pour `dish.ingredient` afin d'éviter duplication, ou versionner les ingrédients s'il est important de garder l'historique immuable.
- Documenter clairement le flow de création d'ordre (transaction: créer order + incrémenter `client.totalOrders`). Utiliser `runTransaction` pour atomicité (une fonction `src/services/firestore.ts` peut centraliser cela).

---

Si vous voulez, je peux :
- Générer un `.env.example` et modifier `lib/firebase.ts` pour lire la config depuis les variables d'environnement.
- Ajouter un fichier `DATA_MODEL_GRAPH.png` simple (diagramme) ou un diagramme Mermaid et l'intégrer ici.
- Corriger `types/index.ts` pour uniformiser `createdAt`/`updatedAt` au type `Date | Timestamp` et enlever incohérences.

Que souhaitez-vous que je fasse ensuite ?
