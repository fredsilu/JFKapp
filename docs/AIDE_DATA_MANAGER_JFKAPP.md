# Guide d'utilisation — JFKApp Data Manager

Ce guide explique comment utiliser le système de gestion des données JFKApp pour faire des backups, restaurations, resets, vérifications et dry-runs sur Firebase Firestore.

---

## 1. Objectif du Data Manager

Le Data Manager permet de gérer proprement les données Firestore de JFKApp.

Il permet notamment :

- faire un backup complet des données ;
- faire un backup partiel ;
- restaurer toutes les données ;
- restaurer une partie des données ;
- supprimer les données de test ;
- vérifier un backup avant restauration ;
- lister les backups disponibles ;
- sécuriser les opérations en production.

---

## 2. Règles de sécurité

### En environnement TEST

Autorisé :

- backup total ;
- backup partiel ;
- restore total ;
- restore partiel ;
- reset total ;
- reset partiel ;
- dry-run.

Le reset TEST crée automatiquement un backup avant suppression.

### En environnement PRODUCTION

Autorisé :

- backup total ;
- backup partiel ;
- restore total sécurisé ;
- restore partiel sécurisé.

Interdit :

- reset production.

Il ne doit pas exister de script :

```bash
npm run data:reset:prod
```

---

## 3. Structure des groupes de données

Les groupes configurés sont :

### master

Données de référence :

```txt
clients
ingredients
dishes
```

### operations

Données opérationnelles :

```txt
catering_simulations
catering_proformas
orders
catering_invoices
```

### financial

Données financières :

```txt
orders
catering_invoices
```

### all

Toutes les données :

```txt
clients
ingredients
dishes
catering_simulations
catering_proformas
orders
catering_invoices
```

### Collections individuelles

```txt
clients
ingredients
dishes
simulations
proformas
orders
invoices
documents
```

---

## 4. Scripts disponibles dans package.json

```json
{
  "data:backup:test": "dotenv -e .env.test -- cross-env APP_ENV=test tsx scripts/dataManager/backup.ts",
  "data:restore:test": "dotenv -e .env.test -- cross-env APP_ENV=test tsx scripts/dataManager/restore.ts",
  "data:reset:test": "dotenv -e .env.test -- cross-env APP_ENV=test tsx scripts/dataManager/reset.ts",
  "data:list:test": "dotenv -e .env.test -- cross-env APP_ENV=test tsx scripts/dataManager/listBackups.ts",
  "data:verify:test": "dotenv -e .env.test -- cross-env APP_ENV=test tsx scripts/dataManager/verifyBackup.ts",

  "data:backup:prod": "dotenv -e .env.production -- cross-env APP_ENV=production tsx scripts/dataManager/backup.ts",
  "data:restore:prod": "dotenv -e .env.production -- cross-env APP_ENV=production tsx scripts/dataManager/restore.ts",
  "data:list:prod": "dotenv -e .env.production -- cross-env APP_ENV=production tsx scripts/dataManager/listBackups.ts",
  "data:verify:prod": "dotenv -e .env.production -- cross-env APP_ENV=production tsx scripts/dataManager/verifyBackup.ts"
}
```

---

## 5. Backup en TEST

### Backup complet

```bash
npm run data:backup:test -- all
```

### Backup des données de référence

```bash
npm run data:backup:test -- master
```

### Backup des données opérationnelles

```bash
npm run data:backup:test -- operations
```

### Backup des données financières

```bash
npm run data:backup:test -- financial
```

### Backup d'une seule collection

```bash
npm run data:backup:test -- clients
npm run data:backup:test -- ingredients
npm run data:backup:test -- dishes
npm run data:backup:test -- simulations
npm run data:backup:test -- proformas
npm run data:backup:test -- orders
npm run data:backup:test -- invoices
npm run data:backup:test -- documents
```

---

## 6. Backup en PRODUCTION

### Backup complet production

```bash
npm run data:backup:prod -- all
```

### Backup partiel production

```bash
npm run data:backup:prod -- master
npm run data:backup:prod -- operations
npm run data:backup:prod -- financial
npm run data:backup:prod -- clients
npm run data:backup:prod -- invoices
```

Recommandation : faire régulièrement un backup production avant toute livraison importante.

---

## 7. Lister les backups

### Lister les backups TEST

```bash
npm run data:list:test
```

### Lister les backups PRODUCTION

```bash
npm run data:list:prod
```

Exemple de résultat :

```txt
operations
----------
operations-2026-05-31T10-30-00-000Z.json

master
------
master-2026-05-31T10-45-00-000Z.json
```

---

## 8. Vérifier un backup

### Vérifier le dernier backup d'un groupe

```bash
npm run data:verify:test -- operations latest
```

### Vérifier un fichier spécifique

```bash
npm run data:verify:test -- operations operations-2026-05-31T10-30-00-000Z.json
```

### Vérifier un backup production

```bash
npm run data:verify:prod -- all latest
```

La vérification contrôle :

- le nom de l'application ;
- l'environnement ;
- le groupe ;
- la présence des collections ;
- le nombre de documents ;
- le total général.

---

## 9. Restore en TEST

En TEST, la restauration fonctionne en mode REPLACE.

Cela signifie :

1. la collection est vidée ;
2. les données du backup sont réimportées ;
3. la base devient identique au backup.

### Restore du dernier backup operations

```bash
npm run data:restore:test -- operations latest
```

Confirmation demandée :

```txt
RESTORE_TEST_JFKAPP
```

### Restore complet

```bash
npm run data:restore:test -- all latest
```

### Restore partiel

```bash
npm run data:restore:test -- clients latest
npm run data:restore:test -- invoices latest
npm run data:restore:test -- financial latest
```

---

## 10. Restore en PRODUCTION

En PRODUCTION, la restauration fonctionne en mode MERGE.

Cela signifie :

- les documents existants sont conservés ;
- les documents du backup sont ajoutés ou mis à jour ;
- aucune collection n'est vidée automatiquement.

Avant un restore production, le script exige :

1. le mot de passe administrateur ;
2. une confirmation manuelle ;
3. un backup automatique de sécurité ;
4. une écriture dans `logs/audit.log`.

### Variable obligatoire dans `.env.production`

```env
JFKAPP_ADMIN_RESTORE_PASSWORD=mettre_un_mot_de_passe_fort_ici
```

### Restore production

```bash
npm run data:restore:prod -- clients latest
```

Confirmation demandée :

```txt
RESTORE_PRODUCTION_JFKAPP
```

---

## 11. Dry-run Restore

Le dry-run permet de simuler une restauration sans modifier Firestore.

### Dry-run TEST

```bash
npm run data:restore:test -- operations latest --dry-run
```

### Dry-run PRODUCTION

```bash
npm run data:restore:prod -- operations latest --dry-run
```

Résultat attendu :

```txt
Dry Run : YES
TOTAL : 120 documents
Aucune donnée n'a été modifiée.
```

---

## 12. Reset en TEST

Le reset supprime les données d'un groupe ou d'une collection.

Le reset est autorisé uniquement en TEST.

Avant suppression :

1. le script affiche le nombre de documents ;
2. le script crée un backup automatique ;
3. le script demande confirmation ;
4. le script supprime les données ;
5. le script écrit dans `logs/audit.log`.

### Reset total TEST

```bash
npm run data:reset:test -- all
```

Confirmation demandée :

```txt
RESET_TEST_JFKAPP
```

### Reset operations

```bash
npm run data:reset:test -- operations
```

### Reset financial

```bash
npm run data:reset:test -- financial
```

### Reset collection unique

```bash
npm run data:reset:test -- clients
npm run data:reset:test -- invoices
npm run data:reset:test -- proformas
```

---

## 13. Dry-run Reset

Le dry-run reset permet de voir ce qui serait supprimé sans supprimer.

```bash
npm run data:reset:test -- operations --dry-run
```

Résultat attendu :

```txt
Dry Run : YES
TOTAL : 120 documents
Aucune donnée n'a été supprimée.
```

---

## 14. Organisation des backups

Les fichiers sont rangés comme ceci :

```txt
backups/
  test/
    all/
    master/
    operations/
    financial/
    clients/
    invoices/

  production/
    all/
    master/
    operations/
    financial/
    clients/
    invoices/
```

Chaque fichier contient :

```json
{
  "app": "JFKApp",
  "env": "test",
  "group": "operations",
  "createdAt": "2026-05-31T10:30:00.000Z",
  "collections": {
    "catering_simulations": [],
    "catering_proformas": [],
    "orders": [],
    "catering_invoices": []
  }
}
```

---

## 15. Audit log

Toutes les actions importantes sont enregistrées dans :

```txt
logs/audit.log
```

Exemples :

```txt
[2026-05-31T10:30:00.000Z] [BACKUP] env=test group=operations file=operations-...
[2026-05-31T10:35:00.000Z] [RESTORE] env=test group=operations mode=REPLACE
[2026-05-31T10:40:00.000Z] [RESET] env=test group=operations
```

---

## 16. Scénarios pratiques

### Avant une grosse modification du code

```bash
npm run data:backup:test -- all
```

### Avant de tester une nouvelle logique de facturation

```bash
npm run data:backup:test -- financial
```

### Revenir à la dernière base test stable

```bash
npm run data:restore:test -- all latest
```

### Nettoyer uniquement les simulations et documents opérationnels

```bash
npm run data:reset:test -- operations
```

### Tester ce qui sera supprimé sans supprimer

```bash
npm run data:reset:test -- operations --dry-run
```

### Vérifier un backup avant restauration

```bash
npm run data:verify:test -- operations latest
```

---

## 17. Commandes Git recommandées

Après mise en place complète :

```bash
git add .

git commit -m "feat(data-manager): add secure data management guide"
```

Après une amélioration du Data Manager :

```bash
git add .

git commit -m "chore(data-manager): improve backup restore utilities"
```

---

## 18. Règles d'or

1. Ne jamais créer `data:reset:prod`.
2. Toujours faire un backup avant une opération sensible.
3. Toujours utiliser `--dry-run` en cas de doute.
4. Ne jamais restaurer un backup TEST en PRODUCTION.
5. Ne jamais partager `serviceAccountKey.json`.
6. Ne jamais partager `.env.production`.
7. Garder les backups production dans un endroit sécurisé.
8. Vérifier les backups critiques avec `data:verify`.
9. En production, restaurer seulement si nécessaire.
10. Les factures et documents financiers doivent toujours être traités avec prudence.

---

## 19. Résumé rapide des commandes

```bash
# Backup TEST
npm run data:backup:test -- all
npm run data:backup:test -- master
npm run data:backup:test -- operations
npm run data:backup:test -- financial

# Restore TEST
npm run data:restore:test -- all latest
npm run data:restore:test -- operations latest

# Reset TEST
npm run data:reset:test -- all
npm run data:reset:test -- operations
npm run data:reset:test -- financial

# Dry-run
npm run data:restore:test -- operations latest --dry-run
npm run data:reset:test -- operations --dry-run

# Lister
npm run data:list:test

# Vérifier
npm run data:verify:test -- operations latest

# Production
npm run data:backup:prod -- all
npm run data:restore:prod -- clients latest
npm run data:list:prod
npm run data:verify:prod -- all latest
```

---

## 20. Statut du Data Manager

Version actuelle :

```txt
JFKApp Data Manager v1
```

Fonctionnalités couvertes :

```txt
✅ backup total
✅ backup partiel
✅ restore total
✅ restore partiel
✅ reset test total
✅ reset test partiel
✅ dry-run restore
✅ dry-run reset
✅ verify backup
✅ list backups
✅ audit log
✅ sécurité production
✅ séparation test / production
```
