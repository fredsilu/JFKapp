# JFKApp

A React Native app built with Expo and Expo Router for managing clients, dishes, ingredients, and orders.

Key tech:
- Expo + Expo Router
- React 19 / React Native 0.81
- Firebase for backend/storage

## Quick start

Prerequisites:
- Node.js (recommend Node 18+)
- npm or yarn
- (Optional) install `expo-cli` or use `npx`

Install dependencies:

```bash
npm install
```

Run the app (Metro + Expo DevTools):

```bash
npx expo start
# or
npm run start
```

Open on a device/emulator using the QR code, or run:

```bash
npm run android
npm run ios
npm run web
```

Linting:

```bash
npm run lint
```

Reset starter example (script provided):

```bash
npm run reset-project
```

## Build & Deploy

This project includes `eas.json` for EAS builds. Use EAS / Expo docs to create production builds and submit to stores.

## Project structure (high level)
- `app/` — file-based routes and screens (Expo Router)
- `components/` — reusable UI components (forms, pickers, modals)
- `src/` — app-specific hooks, services, and utilities (`src/services/firestore.ts`, `src/services/storage.ts`)
- `lib/` — `lib/firebase.ts` contains Firebase initialization
- `assets/` — fonts, images, icons
- `types/` — TypeScript types

There are example tests under `components/__tests__/`.

## Firebase

The app uses Firebase (see `lib/firebase.ts`). Keep your Firebase credentials / environment configuration out of source control — set them via environment variables or Expo secrets when building.

## Contributing

If you'd like to contribute, open an issue or a pull request. Suggested steps:
1. Fork the repo
2. Create a feature branch
3. Run tests and linting
4. Open a PR with a clear description

## Useful files
- [package.json](package.json) — scripts & dependencies
- [app.json](app.json) — Expo app config
- [eas.json](eas.json) — EAS build config
- [lib/firebase.ts](lib/firebase.ts) — Firebase setup

---



Explication complète (français)

But général

Application Expo/React Native (nom : JFKApp) pour gérer clients, plats (dishes), ingrédients et commandes.
Navigation basée sur Expo Router (file-based routing dans le dossier app).
Backend : Firebase (Firestore + Storage). Le fichier d'initialisation est firebase.ts.
Entrée / navigation

_layout.tsx : layout racine — charge les polices, gère le splash screen, fournit le thème (dark/light) et construit une pile (Stack) avec l'entrée vers (tabs) et une route +not-found.
index.tsx : configuration des onglets (tabs). C'est ici que sont définis les écrans principaux de l'application (Clients, Dishes, Orders, Ingredients).
index.tsx (dashboard) : écran d'accueil montrant statistiques (revenu du jour, commandes actives, clients, plats populaires). Il consomme les hooks qui lisent Firestore (useOrders, useClients, useDishes) et affiche des cartes / listes.
Structure de code et composants

app : routes et écrans — structure file-based pour Expo Router.
components : composants réutilisables (ex. ClientForm.tsx, ClientDetails.tsx, DishForm.tsx, IngredientForm.tsx, OrderForm.tsx, ImagePicker.tsx, Modal.tsx). Ces composants gèrent l'UI pour créer/éditer/afficher entités.
src :
firestore.ts : fonctions CRUD pour Firestore — getOrders, addOrder, updateOrder, addDish, updateDish, addIngredient, updateIngredient, addClient, updateClient. Les fonctions utilisent Timestamp.now() pour createdAt/updatedAt et convertissent en Date côté client.
storage.ts : upload / suppression d'images (par ex. uploadProfilePicture, deleteProfilePicture) en utilisant firebase/storage.
useFirestore.ts (présent dans workspace) : probable ensemble de hooks personnalisés (useOrders, useClients, useDishes) qui souscrivent aux collections Firestore et renvoient { data, loading, error }. Ces hooks alimentent les écrans.
LoadingSpinner.tsx, ErrorMessage.tsx : composants utilitaires pour affichage d'état.
Firebase (initialisation & offline)

firebase.ts :
Initialise Firebase avec initializeApp(firebaseConfig).
Expose db (Firestore) et storage (Storage).
Tente d'activer la persistance IndexedDB (enableIndexedDbPersistence(db)) et gère erreurs typiques (failed-precondition, unimplemented).
Remarque de sécurité : les clés Firebase (apiKey, authDomain, etc.) sont directement dans firebase.ts. Recommandation : les déplacer dans des variables d'environnement (Expo app.config/app.json extra, .env, ou secrets EAS) pour éviter l'exposition involontaire.
Flux de données (haute niveau)

UI (écrans sous app) → utilise hooks personnalisés qui souscrivent aux collections Firestore via onSnapshot (probable) ou getDocs.
Actions utilisateur (create/update/delete) → appellent les fonctions exportées depuis firestore.ts (par ex. addOrder, updateDish) qui effectuent addDoc, updateDoc.
Images (photos de profil, images de plats) → upload via storage.ts -> uploadBytes puis getDownloadURL; URL stockée dans le document Firestore correspondant.
Offline : Firestore persistence activée permet lecture hors-ligne et synchronisation quand la connexion revient.
Types et sécurité

types : contient les interfaces TypeScript (Order, Dish, Ingredient, Client) — assurez la cohérence des données côté client.
Vérifier règles Firestore (non vues ici) : s’assurer que les règles de sécurité Firebase protègent l'accès en production (authentification, règles allow read/write conditionnelles). Aujourd'hui, auth est importé mais commenté (getAuth dans firebase.ts), donc potentiellement pas d'authentification active.
Scripts & développement local

package.json scripts utiles :
start / android / ios / web — démarrage Expo
reset-project — script custom reset-project.js
lint — expo lint
Dépendances : expo, expo-router, firebase v11, react-native-vector-icons, etc.
Tests

ThemedText-test.tsx existe : project a infrastructure de test (Jest / react-test-renderer types). Recommander d'ajouter commandes test si non présentes et CI.
Points d'attention / améliorations recommandées (pratiques pour le prochain dev)

Sécurité des clés Firebase : extraire config sensible dans des variables d'env et documenter comment les fournir en local / CI / EAS.
Authentification : si l'app doit restreindre accès, réactiver et configurer firebase/auth + règles Firestore.
Tests : ajouter script npm test et des tests d'intégration pour les services Firestore (ou mock).
Gestion des erreurs utilisateur : centraliser logique d'erreur (toasts / notifications) et afficher feedback sur upload d'images / échec réseau.
Documentation pour la DB : ajouter un fichier DATA_MODEL.md ou section dans le README décrivant les collections Firestore, champs obligatoires, indexes nécessaires (ex: tri par createdAt).
CI / EAS : ajouter badges et scripts CI (ex: GitHub Actions) pour lint, test, et builds EAS.
Migration Firebase config : documenter la procédure pour créer un projet Firebase et obtenir les valeurs à mettre dans l'environnement.
Stockage d'images : vérifier règles de stockage pour empêcher accès non autorisé aux images si nécessaire.
Où modifier / étendre (repères pratiques)

Routes / navigation : app — ajouter un nouvel écran => créer un fichier route (app/new-screen.tsx) ou un composant dans (tabs) si onglet requis.
Logique métiers / DB : firestore.ts — ajouter fonctions CRUD ou transactions complexes (utiliser runTransaction si besoin).
Uploads : storage.ts — adapter pour Web/Expo FileSystem si nécessaire (convertir images Expo -> Blob).
Firebase init / config : firebase.ts — remplacer config statique par import depuis process.env ou expo-constants extra.
Hooks : useFirestore.ts — central pour abonnements et cache; améliorer pagination et gestion d'erreurs.
UI : components — formulaires réutilisables (*Form.tsx) et détails (*Details.tsx) => tests visuels et snapshots.
Checklist rapide pour transmettre le projet

 Ajouter un fichier ENVIRONMENT.md expliquant comment fournir config Firebase localement.
 Déplacer clés Firebase dans variables d'environnement et mettre un exemple .env.example.
 Documenter les collections Firestore et champs (ex: orders.dishes structure).
 Expliquer comment exécuter les scripts : démarrer (Expo), runs Android/iOS/web, lint.
 Indiquer commandes pour ajouter Clefs EAS (si usage EAS).
 Indiquer où démarrer pour ajouter fonctionnalité X (ex : support multi-taxes sur plat -> modifier types, update form, update services).