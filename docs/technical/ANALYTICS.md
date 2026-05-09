# Analytics Dashboard - JFKApp

## Overview
The Analytics Dashboard provides comprehensive insights into restaurant performance with real-time KPI tracking, revenue trends, and performance metrics.

## Features

### 1. **Key Performance Indicators (KPIs)**
- **Daily Revenue**: Revenue for the current day
- **Weekly Revenue**: Total revenue for the past 7 days
- **Monthly Revenue**: Total revenue for the current month
- **Daily Orders**: Number of orders placed today
- **Weekly Orders**: Number of orders placed in the past 7 days
- **Monthly Orders**: Number of orders placed in the current month
- **Average Order Value**: Mean order value
- **Delivery Completion Rate**: Percentage of orders successfully delivered

Each KPI includes:
- Current value with icon
- Trend indicator (up/down with percentage change)
- Color-coded backgrounds for visual clarity

### 2. **Charts & Visualizations**

#### Revenue Trend Chart (Line Chart)
- 7-day revenue history
- Daily breakdown
- Smooth line visualization
- Interactive data points

#### Top Dishes Chart (Bar Chart)
- Top 5 highest revenue-generating dishes
- Revenue comparison
- Rank-based display

#### Order Status Distribution (Pie Chart)
- Breakdown by status:
  - **En cours** (In Progress)
  - **En préparation** (Preparation)
  - **Livré** (Delivered)
- Percentage representation

### 3. **Ranked Lists**

#### Top Dishes
- Ranked by revenue generated
- Shows:
  - Dish name
  - Number of orders
  - Total revenue
- Top 5 dishes displayed

#### Top Clients
- Ranked by total spending
- Shows:
  - Client name
  - Number of orders
  - Last order date
  - Total spending
- Top 5 clients displayed

#### Ingredient Usage
- Top 10 most frequently used ingredients
- Shows:
  - Ingredient name
  - Usage frequency
  - Total quantity used
- Progress bar visualization

## Technical Details

### Files
- **app/analytics.tsx** - Main analytics page
- **src/utils/analytics.ts** - Core calculation functions
- **components/AnalyticsCharts.tsx** - Chart visualizations
- **components/KPICards.tsx** - KPI display components
- **components/AnalyticsLists.tsx** - List components for rankings

### Data Flow
```
Firestore Orders
    ↓
useOrders() Hook (real-time listener)
    ↓
Analytics Calculation Functions
    ├─ calculateKPIs()
    ├─ getTopDishes()
    ├─ getTopClients()
    ├─ getDailyRevenueData()
    ├─ getStatusDistribution()
    └─ getIngredientUsageData()
    ↓
UI Components
    ├─ KPIGrid
    ├─ RevenueChart
    ├─ TopDishesChart
    ├─ StatusDistributionChart
    ├─ TopDishesList
    ├─ TopClientsList
    └─ IngredientUsageList
```

### Dependencies
- **react-native-chart-kit**: Chart visualizations (LineChart, BarChart, PieChart)
- **@expo/vector-icons**: Icons for KPIs and UI
- **Firebase/Firestore**: Real-time data source

### Real-time Updates
The analytics dashboard automatically updates when orders are added, modified, or deleted through the Firestore real-time listener in the `useOrders()` hook.

## Accessing Analytics

### From Dashboard
Click the **Analytics** button (chart icon) in the top-right corner of the Dashboard screen.

### Programmatic Navigation
```tsx
import { useRouter } from 'expo-router';

const router = useRouter();
router.push('/analytics');
```

## Calculation Methods

### Daily Revenue
```
Sum of all order totals for today
= Sum(dishes total + additional ingredients total) where date = today
```

### Weekly/Monthly Revenue
```
Sum of all order totals for the past 7/30 days
```

### Average Order Value
```
Total Revenue / Total Orders
```

### Delivery Completion Rate
```
(Delivered Orders / Total Orders) × 100
```

### Trends
```
Percentage Change = ((Current Period - Previous Period) / Previous Period) × 100
- Positive trend (green): Increase in metrics
- Negative trend (red): Decrease in metrics
```

### Top Rankings
```
Aggregated by:
- Revenue generated (dishes)
- Total spending (clients)
- Frequency of use (ingredients)
```

## Performance Considerations

1. **Data Aggregation**: Large datasets are memoized to prevent unnecessary recalculations
2. **Real-time Updates**: Uses Firestore listeners for instant updates
3. **Null Safety**: All calculations include proper null/undefined checks
4. **Chart Rendering**: Charts are optimized for both web and mobile platforms

## Future Enhancements

- [ ] Date range filters
- [ ] Export analytics to PDF/Excel
- [ ] Comparison between periods
- [ ] Custom KPI definitions
- [ ] Notification alerts for anomalies
- [ ] Predictive analytics
- [ ] Staff performance metrics
- [ ] Ingredient cost analysis

## Troubleshooting

### No Data Displayed
- Ensure orders exist in Firestore
- Check Firestore connection
- Verify data structure matches expected format

### Charts Not Rendering
- Check if `react-native-chart-kit` is installed
- Verify data arrays are not empty
- Check console for chart library errors

### Slow Performance
- Consider implementing data pagination
- Reduce chart update frequency
- Optimize Firestore queries with indexes

## Notes

- All calculations are performed client-side for real-time responsiveness
- Financial values are formatted using the `formatCurrency()` utility
- Times are displayed in 24-hour format
- Data is timezone-aware based on order creation timestamps
