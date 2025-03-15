// Update status translations
const STATUS_TRANSITIONS: Record<Order['status'], Order['status']> = {
  'En cours': 'En préparation',
  'En préparation': 'Livré',
  'Livré': 'Livré',
};

// Update section titles and labels
const orderStatusTitle = "Statut de la commande";
const markAsText = "Marquer comme";
const clientInfoTitle = "Informations client";
const orderInfoTitle = "Informations commande";
const createdText = "Créé le";
const deliveryTimeText = "Heure de livraison";
const totalItemsText = "Total articles";
const totalText = "Total";
const deliveryAddressTitle = "Adresse de livraison";
const orderedDishesTitle = "Plats commandés";
const ingredientsTitle = "Ingrédients";
const additionalIngredientsTitle = "Ingrédients supplémentaires";

export default additionalIngredientsTitle