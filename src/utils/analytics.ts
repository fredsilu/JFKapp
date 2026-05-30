//src/utils/analytics.ts
import { Order, Dish, Client } from '@/types';

export interface KPI {
  label: string;
  value: string | number;
  unit?: string;
  trend?: number; // percentage change
  icon?: string;
}

export interface DishAnalytics {
  dishId: string;
  dishName: string;
  orderCount: number;
  totalRevenue: number;
  averagePrice: number;
}

export interface ClientAnalytics {
  clientId: string;
  clientName: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate?: Date;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface IngredientUsage {
  ingredientName: string;
  timesPurchased: number;
  totalQuantity: number;
}

export function calculateOrderTotal(order: Order): number {
  let dishesTotal = 0;
  if (order.dishes && Array.isArray(order.dishes)) {
    dishesTotal = order.dishes.reduce((total, { dish, quantity }) => {
      if (!dish || !dish.ingredients || !Array.isArray(dish.ingredients)) {
        return total;
      }
      const dishPrice = dish.ingredients.reduce((dishTotal, { ingredient, quantity: ingredientQty }) => {
        if (!ingredient || !ingredient.price) {
          return dishTotal;
        }
        return dishTotal + (ingredient.price * ingredientQty);
      }, 0);
      return total + (dishPrice * quantity);
    }, 0);
  }

  let ingredientsTotal = 0;
  if (order.additionalIngredients && Array.isArray(order.additionalIngredients)) {
    ingredientsTotal = order.additionalIngredients.reduce((total, { ingredient, quantity }) => {
      if (!ingredient || !ingredient.price) {
        return total;
      }
      return total + (ingredient.price * quantity);
    }, 0);
  }

  return dishesTotal + ingredientsTotal;
}

export function calculateKPIs(orders: Order[]): KPI[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOrders = orders.filter(o => {
    const orderDate = new Date(o.createdAt || 0);
    orderDate.setHours(0, 0, 0, 0);
    return orderDate.getTime() === today.getTime();
  });

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekOrders = orders.filter(o => {
    const orderDate = new Date(o.createdAt || 0);
    return orderDate >= weekAgo;
  });

  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);
  const monthOrders = orders.filter(o => {
    const orderDate = new Date(o.createdAt || 0);
    return orderDate >= monthAgo;
  });

  const todayRevenue = todayOrders.reduce((sum, o) => sum + calculateOrderTotal(o), 0);
  const weekRevenue = weekOrders.reduce((sum, o) => sum + calculateOrderTotal(o), 0);
  const monthRevenue = monthOrders.reduce((sum, o) => sum + calculateOrderTotal(o), 0);

  // Calculate trends
  const weekBeforeLastDay = new Date(weekAgo);
  weekBeforeLastDay.setDate(weekBeforeLastDay.getDate() - 7);
  const weekBeforeOrders = orders.filter(o => {
    const orderDate = new Date(o.createdAt || 0);
    return orderDate >= weekBeforeLastDay && orderDate < weekAgo;
  });
  const weekBeforeRevenue = weekBeforeOrders.reduce((sum, o) => sum + calculateOrderTotal(o), 0);
  const weekTrend = weekBeforeRevenue ? ((weekRevenue - weekBeforeRevenue) / weekBeforeRevenue) * 100 : 0;

  const averageOrderValue = monthOrders.length > 0 ? monthRevenue / monthOrders.length : 0;
  const deliveredOrders =
    monthOrders.filter(
      o => normalizeOrderStatus(o.status) === 'delivered'
    ).length;
  const completionRate = monthOrders.length > 0 ? (deliveredOrders / monthOrders.length) * 100 : 0;

  return [
    {
      label: 'Revenus du jour',
      value: todayRevenue.toFixed(2),
      unit: '$',
    },
    {
      label: 'Revenus de la semaine',
      value: weekRevenue.toFixed(2),
      unit: '$',
      trend: weekTrend,
    },
    {
      label: 'Revenus du mois',
      value: monthRevenue.toFixed(2),
      unit: '$',
    },
    {
      label: 'Commandes du jour',
      value: todayOrders.length,
    },
    {
      label: 'Commandes de la semaine',
      value: weekOrders.length,
    },
    {
      label: 'Commandes du mois',
      value: monthOrders.length,
    },
    {
      label: 'Panier moyen',
      value: averageOrderValue.toFixed(2),
      unit: '$',
    },
    {
      label: 'Taux de livraison',
      value: completionRate.toFixed(1),
      unit: '%',
    },
  ];
}

export function getTopDishes(orders: Order[]): DishAnalytics[] {
  const dishMap = new Map<string, { name: string; count: number; revenue: number }>();

  orders.forEach(order => {
    if (order.dishes && Array.isArray(order.dishes)) {
      order.dishes.forEach(({ dish, quantity }) => {
        if (dish && dish.id) {
          const orderTotal = calculateOrderTotal({ ...order, dishes: [{ dish, quantity, name: dish.name, ingredients: dish.ingredients, additionalIngredients: [] }], additionalIngredients: [] });
          const existing = dishMap.get(dish.id) || { name: dish.name, count: 0, revenue: 0 };
          dishMap.set(dish.id, {
            name: dish.name,
            count: existing.count + quantity,
            revenue: existing.revenue + orderTotal,
          });
        }
      });
    }
  });

  return Array.from(dishMap.entries())
    .map(([id, data]) => ({
      dishId: id,
      dishName: data.name,
      orderCount: data.count,
      totalRevenue: data.revenue,
      averagePrice: data.count > 0 ? data.revenue / data.count : 0,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);
}

export function getTopClients(orders: Order[]): ClientAnalytics[] {
  const clientMap = new Map<string, { name: string; count: number; spent: number; lastDate: Date }>();

  orders.forEach(order => {
    if (order.client && order.client.id) {
      const orderTotal = calculateOrderTotal(order);
      const existing = clientMap.get(order.client.id);
      const orderDate = new Date(order.createdAt || 0);
      const lastDate = existing && existing.lastDate > orderDate ? existing.lastDate : orderDate;

      clientMap.set(order.client.id, {
        name: order.client.name,
        count: (existing?.count || 0) + 1,
        spent: (existing?.spent || 0) + orderTotal,
        lastDate,
      });
    }
  });

  return Array.from(clientMap.entries())
    .map(([id, data]) => ({
      clientId: id,
      clientName: data.name,
      orderCount: data.count,
      totalSpent: data.spent,
      lastOrderDate: data.lastDate,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);
}

export function getDailyRevenueData(orders: Order[], days: number = 7): DailyRevenue[] {
  const revenueMap = new Map<string, { revenue: number; count: number }>();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - (days - 1 - i));
    const dateStr = date.toISOString().split('T')[0];
    revenueMap.set(dateStr, { revenue: 0, count: 0 });
  }

  orders.forEach(order => {
    const orderDate = new Date(order.createdAt || 0);
    orderDate.setHours(0, 0, 0, 0);
    const dateStr = orderDate.toISOString().split('T')[0];

    if (revenueMap.has(dateStr)) {
      const existing = revenueMap.get(dateStr)!;
      const orderTotal = calculateOrderTotal(order);
      revenueMap.set(dateStr, {
        revenue: existing.revenue + orderTotal,
        count: existing.count + 1,
      });
    }
  });

  return Array.from(revenueMap.entries())
    .map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orderCount: data.count,
    }));
}

function normalizeOrderStatus(status?: string) {
  switch (status) {
    case 'En cours':
      return 'confirmed';

    case 'En préparation':
      return 'in-production';

    case 'Livré':
      return 'delivered';

    case 'Annulé':
      return 'cancelled';

    case 'draft':
    case 'sent':
    case 'confirmed':
    case 'in-production':
    case 'delivered':
    case 'cancelled':
      return status;

    default:
      return 'confirmed';
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'draft':
      return 'Brouillon';

    case 'sent':
      return 'Envoyée';

    case 'confirmed':
      return 'Confirmée';

    case 'in-production':
      return 'En préparation';

    case 'delivered':
      return 'Livrée';

    case 'cancelled':
      return 'Annulée';

    default:
      return 'Confirmée';
  }
}

export function getStatusDistribution(
  orders: Order[]
): { status: string; count: number; percentage: number }[] {
  const statusMap: Record<string, number> = {
    draft: 0,
    sent: 0,
    confirmed: 0,
    'in-production': 0,
    delivered: 0,
    cancelled: 0,
  };

  orders.forEach((order) => {
    const status = normalizeOrderStatus(order.status);
    statusMap[status] = (statusMap[status] || 0) + 1;
  });

  const total = orders.length || 1;

  return Object.entries(statusMap)
    .map(([status, count]) => ({
      status: getStatusLabel(status),
      count,
      percentage: (count / total) * 100,
    }))
    .filter((item) => item.count > 0);
}

export function getIngredientUsageData(orders: Order[]): IngredientUsage[] {
  const ingredientMap = new Map<string, { name: string; count: number; quantity: number }>();

  orders.forEach(order => {
    if (order.dishes && Array.isArray(order.dishes)) {
      order.dishes.forEach(({ dish, quantity }) => {
        if (dish && dish.ingredients && Array.isArray(dish.ingredients)) {
          dish.ingredients.forEach(({ ingredient, quantity: ingredientQty }) => {
            if (ingredient && ingredient.id) {
              const existing = ingredientMap.get(ingredient.id) || { name: ingredient.name, count: 0, quantity: 0 };
              ingredientMap.set(ingredient.id, {
                name: ingredient.name,
                count: existing.count + 1,
                quantity: existing.quantity + (ingredientQty * quantity),
              });
            }
          });
        }
      });
    }

    if (order.additionalIngredients && Array.isArray(order.additionalIngredients)) {
      order.additionalIngredients.forEach(({ ingredient, quantity }) => {
        if (ingredient && ingredient.id) {
          const existing = ingredientMap.get(ingredient.id) || { name: ingredient.name, count: 0, quantity: 0 };
          ingredientMap.set(ingredient.id, {
            name: ingredient.name,
            count: existing.count + 1,
            quantity: existing.quantity + quantity,
          });
        }
      });
    }
  });

  return Array.from(ingredientMap.entries())
    .map(([id, data]) => ({
      ingredientName: data.name,
      timesPurchased: data.count,
      totalQuantity: data.quantity,
    }))
    .sort((a, b) => b.timesPurchased - a.timesPurchased)
    .slice(0, 10);
}
