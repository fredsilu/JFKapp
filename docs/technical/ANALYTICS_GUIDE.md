# Analytics Quick Start Guide

## 🚀 Accès aux Analytics

### Via l'Interface
1. Ouvrez l'application sur le Dashboard (écran d'accueil)
2. Cliquez sur le bouton **Analytics** (icône graphique) en haut à droite
3. Le tableau de bord s'affichera avec tous les graphiques et KPIs

### Via le Code
```tsx
import { useRouter } from 'expo-router';

const router = useRouter();
router.push('/analytics');
```

## 📊 Éléments du Dashboard

### 1️⃣ KPI Cards (Haut de la page)
```
┌─────────────────────────────────────────┐
│ Revenus du jour: $2,450.50  📈 +12.5%   │
│ Commandes du jour: 8         📈 +5.2%   │
│ Revenus de la semaine: $15,230.00       │
│ Panier moyen: $189.50                   │
└─────────────────────────────────────────┘
```
- **Interprétation**: Flèche verte = tendance positive, rouge = négative
- **Pourcentage**: Comparaison avec la période précédente

### 2️⃣ Revenue Chart (Graphique en courbe)
```
$5000 ┤    ╱╲
$4000 ┤   ╱  ╲
$3000 ┤  ╱    ╲
$2000 ┤─╱      ╲
$1000 ┤        ╲
    L M M J V S D
```
- **Montre**: Revenu sur les 7 derniers jours
- **Utilité**: Identifier les jours forts et faibles

### 3️⃣ Top Dishes Chart (Graphique en barres)
```
Tajine Agneau    ████████████░ $2,340
Couscous Merguez ████████░░░░░ $1,560
Pastilla         ██████░░░░░░░ $1,120
```
- **Montre**: 5 plats les plus rentables
- **Utilité**: Connaître ses best-sellers

### 4️⃣ Order Status (Graphique en camembert)
```
     Livré 65%
    ╱──────────╲
   │           │ En cours 20%
   │ Pie Chart │
    ╲──────────╱
   En préparation 15%
```
- **Montre**: Répartition des statuts de commandes
- **Utilité**: Voir le flux de travail

### 5️⃣ Top Dishes List (Classement)
```
🥇 Tajine Agneau     • 45 commandes • $2,340
🥈 Couscous Merguez  • 38 commandes • $1,560
🥉 Pastilla          • 28 commandes • $1,120
4️⃣  Briouates       • 22 commandes • $880
5️⃣  Harira          • 15 commandes • $630
```
- **Montre**: Classement des meilleurs plats par revenu
- **Données**: Nombre de commandes et revenu total

### 6️⃣ Top Clients List (Classement)
```
🥇 Mr. Ahmed Bouzoubaa  • 12 commandes • Hier • $2,450
🥈 Mme. Fatima Chekir   • 8 commandes  • 2j    • $1,680
🥉 Mr. Karim Bensaid    • 5 commandes  • 5j    • $950
```
- **Montre**: Clients les plus généreux
- **Données**: Nombre de commandes, dernière commande, total dépensé

### 7️⃣ Ingredient Usage List (Ingrédients)
```
1. Semoule           ███████████░ 450 kg
2. Agneau            █████████░░░ 380 kg
3. Poulet            ████████░░░░ 320 kg
4. Oignons           ███████░░░░░ 280 kg
5. Tomates           ██████░░░░░░ 240 kg
```
- **Montre**: 10 ingrédients les plus utilisés
- **Utilité**: Gérer les stocks

## 📈 Calculs Détaillés

### Revenus
```
Revenu d'une commande = 
  Somme(Prix de chaque ingrédient × Quantité) 
  pour chaque plat × Quantité du plat
```

**Exemple:**
- Couscous avec: Semoule ($2.50 × 300g) + Merguez ($8 × 200g) = $10.50

### Panier Moyen
```
Panier Moyen = Revenu Total / Nombre de Commandes
```

### Taux de Livraison
```
Taux = (Nombre de commandes livrées / Total commandes) × 100
```

### Tendances
```
Tendance = ((Période actuelle - Période précédente) / Période précédente) × 100

Exemple: Si hier = $1000, aujourd'hui = $1200
  Tendance = ((1200 - 1000) / 1000) × 100 = +20%
```

## 🔄 Mises à Jour en Temps Réel

Les analytics se mettent à jour **automatiquement** quand:
- ✅ Une nouvelle commande est reçue
- ✅ Une commande est modifiée (statut changé, etc.)
- ✅ Une commande est annulée
- ✅ Des plats sont ajoutés/supprimés

**Pas besoin de rafraîchir!** Les données sont synchronisées directement depuis Firebase.

## 💡 Cas d'Usage

### 1. Gestion des Stocks
- Consultez "Ingredient Usage" pour voir ce qui s'épuise
- Priorisez vos commandes fournisseurs

### 2. Marketing & Promotions
- Lancez des promotions sur les plats faibles
- Réglez les prix des menus populaires

### 3. Planification des Ressources
- Consultez "Top Clients" pour les clients fidèles
- Préparez plus de portions les jours forts

### 4. Analyse de Performance
- Comparez les tendances jour/semaine/mois
- Identifiez les patterns saisonniers

### 5. Suivi Temps Réel
- Gardez un œil sur le statut des commandes (pie chart)
- Ajustez les processus si retard identifié

## 🎨 Légende des Couleurs

| Couleur | Signification |
|---------|---------------|
| 🟠 Orange | Revenus (en cours) |
| 🟢 Vert | Croissance positive |
| 🟡 Jaune | Avertissement/attention |
| 🔴 Rouge | Baisse/problème |
| 🔵 Bleu | Information générale |

## ⚙️ Paramètres & Filtres (À venir)

Futures améliorations prévues:
- [ ] Filtrer par date personnalisée
- [ ] Exporter en PDF/Excel
- [ ] Comparer deux périodes
- [ ] Alertes automatiques (seuils)

## 🐛 Dépannage

### "Aucune donnée affichée"
- ✅ Vérifiez qu'il y a des commandes en base
- ✅ Vérifiez la connexion Firebase
- ✅ Attendre le chargement des données

### "Les graphiques ne s'affichent pas"
- ✅ Vérifier la console pour les erreurs
- ✅ Vérifier que react-native-chart-kit est installé
- ✅ Rafraîchir l'application

### "Les données ne se mettent pas à jour"
- ✅ Vérifier la connexion internet
- ✅ Vérifier que Firestore est accessible
- ✅ Redémarrer l'app

## 📞 Support

Pour des questions ou suggestions:
1. Consultez [ANALYTICS.md](./ANALYTICS.md) pour la documentation complète
2. Consultez [ANALYTICS_INTEGRATION.md](./ANALYTICS_INTEGRATION.md) pour l'intégration technique
3. Vérifiez [DATA_MODEL.md](./DATA_MODEL.md) pour la structure des données

## ✨ Conseils Pro

1. **Vérifiez les KPIs quotidiennement** - Repérez les anomalies
2. **Comparez les périodes** - Identifiez les tendances
3. **Utilisez les classements** - Ajustez vos menus
4. **Surveillez les ingrédients** - Évitez les ruptures de stock
5. **Suivez les clients VIP** - Offrez des services personnalisés

---

**Bon travail! Les analytics professionnels sont maintenant entre vos mains! 📊🚀**
