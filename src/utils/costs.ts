import { Dish, Order, DishIngredient, OrderIngredient } from '@/types';

/**
 * Calcule le coût total des ingrédients d'un plat
 */
export function calculateDishIngredientsCost(ingredients: DishIngredient[]): number {
  if (!ingredients || !Array.isArray(ingredients)) {
    return 0;
  }
  return ingredients.reduce((total, { ingredient, quantity }) => {
    if (!ingredient || !ingredient.price) {
      return total;
    }
    return total + (ingredient.price * quantity);
  }, 0);
}

/**
 * Calcule le coût total d'un plat avec sa marge
 */
export function calculateDishTotalCost(dish: Dish, margin: number = 0.3): number {
  if (!dish || !dish.ingredients) {
    return 0;
  }
  const ingredientsCost = calculateDishIngredientsCost(dish.ingredients);
  return ingredientsCost * (1 + margin);
}

/**
 * Calcule le coût des ingrédients supplémentaires d'une commande
 */
export function calculateAdditionalIngredientsCost(ingredients: OrderIngredient[]): number {
  if (!ingredients || !Array.isArray(ingredients)) {
    return 0;
  }
  return ingredients.reduce((total, { ingredient, quantity }) => {
    if (!ingredient || !ingredient.price) {
      return total;
    }
    return total + (ingredient.price * quantity);
  }, 0);
}

/**
 * Calcule le coût total d'une commande
 */
export function calculateOrderTotalCost(order: Order, margin: number = 0.3): number {
  if (!order) {
    return 0;
  }

  // Calcul du coût des plats
  const dishesCost = order.dishes && Array.isArray(order.dishes) ? order.dishes.reduce((total, { dish, quantity }) => {
    if (!dish) {
      return total;
    }
    const dishCost = calculateDishTotalCost(dish, margin);
    return total + (dishCost * quantity);
  }, 0) : 0;

  // Calcul du coût des ingrédients supplémentaires
  const additionalIngredientsCost = calculateAdditionalIngredientsCost(
    order.additionalIngredients ?? []
  );

  return dishesCost + additionalIngredientsCost;
}

/**
 * Calcule la marge bénéficiaire d'une commande
 */
export function calculateOrderProfit(order: Order, margin: number = 0.3): number {
  const totalCost = calculateOrderTotalCost(order, 0); // Coût sans marge
  const totalWithMargin = calculateOrderTotalCost(order, margin);
  return totalWithMargin - totalCost;
}

/**
 * Formate un montant en dollars américains (USD)
 */
export function formatCurrency(amount?: number): string {
  const value = amount ?? 0;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
