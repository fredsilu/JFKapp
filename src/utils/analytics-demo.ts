/**
 * Analytics Demo & Sample Data
 * This file demonstrates the analytics features with sample data
 */

import { Order } from '@/types';

/**
 * Sample orders for testing analytics
 * These represent typical data that would come from Firestore
 */
export const SAMPLE_ORDERS: Order[] = [
  {
    id: '1',
    clientId: 'client1',
    client: {
      id: 'client1',
      name: 'Jean Dupont',
      phone: '06 12 34 56 78',
      profilePicture: '',
      createdAt: new Date('2024-01-15'),
    },
    dishes: [
      {
        dish: {
          id: 'dish1',
          name: 'Couscous Merguez',
          preparationTime: 20,
          servings: 2,
          image: '',
          ingredients: [
            { ingredient: { id: 'ing1', name: 'Semoule', price: 2.5 }, quantity: 300 },
            { ingredient: { id: 'ing2', name: 'Merguez', price: 8 }, quantity: 200 },
          ],
        },
        quantity: 1,
      },
    ],
    additionalIngredients: [],
    status: 'Livré',
    deliveryDate: '2024-01-01',
    deliveryTime: '12:30',
    address: '123 Rue de Paris',
    deliveryAddress: '123 Rue de Paris',
    createdAt: new Date('2024-01-01T10:00:00').toISOString(),
  },
  {
    id: '2',
    clientId: 'client2',
    client: {
      id: 'client2',
      name: 'Marie Martin',
      phone: '06 98 76 54 32',
      profilePicture: '',
      createdAt: new Date('2024-01-10'),
    },
    dishes: [
      {
        dish: {
          id: 'dish2',
          name: 'Tajine Agneau',
          preparationTime: 30,
          servings: 3,
          image: '',
          ingredients: [
            { ingredient: { id: 'ing3', name: 'Agneau', price: 15 }, quantity: 500 },
            { ingredient: { id: 'ing4', name: 'Pruneaux', price: 5 }, quantity: 100 },
          ],
        },
        quantity: 2,
      },
    ],
    additionalIngredients: [
      { ingredient: { id: 'ing1', name: 'Semoule', price: 2.5 }, quantity: 100 },
    ],
    status: 'Livré',
    deliveryDate: '2024-01-02',
    deliveryTime: '13:00',
    address: '456 Avenue de Lyon',
    deliveryAddress: '456 Avenue de Lyon',
    createdAt: new Date('2024-01-02T11:30:00').toISOString(),
  },
];

/**
 * Analytics Example Output
 * 
 * Given the sample orders above, the analytics would produce:
 * 
 * KPIs:
 * - Daily Revenue: €47.50 (Couscous + Tajine ingredients)
 * - Weekly Revenue: €47.50 (only 2 orders in sample)
 * - Monthly Revenue: €47.50
 * - Daily Orders: 0 (if today is not Jan 1 or 2)
 * - Weekly Orders: 2
 * - Monthly Orders: 2
 * - Average Order Value: €23.75
 * - Delivery Rate: 100% (both delivered)
 * 
 * Top Dishes:
 * 1. Tajine Agneau - 2 orders - €50.00 revenue
 * 2. Couscous Merguez - 1 order - €10.50 revenue
 * 
 * Top Clients:
 * 1. Marie Martin - 2 orders - €50.00 spent
 * 2. Jean Dupont - 1 order - €10.50 spent
 * 
 * Ingredient Usage:
 * 1. Agneau - 500g used
 * 2. Semoule - 400g used
 * 3. Pruneaux - 100g used
 * 4. Merguez - 200g used
 */

/**
 * Features Demonstrated:
 * 
 * 1. Real-time KPI Calculation
 *    - Automatically calculates 8 key metrics
 *    - Updates in real-time as orders change
 *    - Shows trends compared to previous period
 * 
 * 2. Revenue Tracking
 *    - Daily, weekly, and monthly revenue
 *    - Calculates total from ingredient costs
 *    - Includes both main dishes and additional ingredients
 * 
 * 3. Order Analytics
 *    - Tracks order counts by period
 *    - Monitors delivery completion rates
 *    - Calculates average order values
 * 
 * 4. Top Performers
 *    - Identifies best-selling dishes
 *    - Ranks customers by spending
 *    - Lists most-used ingredients
 * 
 * 5. Visual Dashboards
 *    - Charts showing revenue trends
 *    - Bar charts for dish rankings
 *    - Pie charts for status distribution
 *    - KPI cards with color coding
 *    - Ranked lists with badges
 */

/**
 * To use sample data for testing:
 * 
 * In components/AnalyticsCharts.tsx or app/analytics.tsx:
 * 
 * import { SAMPLE_ORDERS } from '@/src/utils/analytics-demo';
 * 
 * // Replace real data with sample data
 * const testOrders = SAMPLE_ORDERS;
 * const kpis = calculateKPIs(testOrders);
 * 
 * This allows testing the analytics display without live data.
 */
