# JFKApp - Restaurant Management Solution 🍽️

A professional React Native/Expo application for managing restaurants with real-time order tracking, ingredient management, client relationships, and comprehensive analytics.

## Features 🚀

### Core Features
- 📋 **Order Management** - Create, track, and manage orders in real-time
- 🍽️ **Dish Management** - Manage menu items with ingredients and preparation times
- 👥 **Client Management** - Track customers with contact info and order history
- 🥘 **Ingredient Management** - Track inventory with pricing and quantities
- 📸 **Image Support** - Upload and display dish and client images
- 🔍 **Search & Filter** - Find orders, dishes, clients, and ingredients quickly

### Advanced Features
- 📊 **Analytics Dashboard** - Professional performance metrics and visualizations
  - 8 Real-time KPIs (revenue, orders, completion rate)
  - Revenue trend charts (7-day history)
  - Top performers (dishes, clients)
  - Ingredient usage tracking
  - Order status distribution
- 📱 **Cross-platform** - Works on iOS, Android, and Web
- ⚡ **Real-time Sync** - Firebase Firestore integration for instant updates
- 🎨 **Professional UI** - Clean, intuitive interface with icons and visual feedback

## Quick Start

### Prerequisites
- Node.js (v14+)
- npm or yarn
- Expo account (optional, for publishing)

### Installation

1. Install dependencies
```bash
npm install
```

2. Start the development server
```bash
npm start
```

3. Run on your platform:
- **iOS**: Press `i`
- **Android**: Press `a`
- **Web**: Press `w`
- **Expo Go**: Scan QR code with Expo Go app

### First Run
The app includes sample data for restaurants. You can:
- View the Dashboard with order summaries
- Browse orders, dishes, clients, and ingredients
- Create new entries or edit existing ones
- View the Analytics dashboard for insights

## Analytics Dashboard 📊

### Accessing Analytics
1. From the Dashboard home screen
2. Click the **Analytics** button (📊 icon) in the top-right
3. View professional performance metrics and visualizations

### Available Metrics
- **Revenue Analytics**: Daily, weekly, monthly revenue with trends
- **Order Analytics**: Order counts and completion rates
- **Top Performers**: Best-selling dishes and top clients
- **Ingredient Tracking**: Most-used ingredients with quantities
- **Status Distribution**: Breakdown of order statuses

### For More Details
👉 See [ANALYTICS_GUIDE.md](./ANALYTICS_GUIDE.md) for complete analytics documentation

## Documentation 📚

- [ANALYTICS.md](./ANALYTICS.md) - Complete analytics features reference
- [ANALYTICS_GUIDE.md](./ANALYTICS_GUIDE.md) - Analytics user guide
- [ANALYTICS_INTEGRATION.md](./ANALYTICS_INTEGRATION.md) - Technical integration details
- [DATA_MODEL.md](./DATA_MODEL.md) - Database schema and data structures
- [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) - Implementation checklist

## Project Structure

```
JFKApp/
├── app/
│   ├── _layout.tsx              # Root layout with navigation
│   ├── analytics.tsx            # Analytics dashboard
│   ├── (tabs)/                  # Tab-based navigation
│   │   ├── index.tsx            # Dashboard
│   │   ├── orders.tsx           # Orders tab
│   │   ├── dishes.tsx           # Dishes tab
│   │   ├── clients.tsx          # Clients tab
│   │   └── ingredients.tsx      # Ingredients tab
│   └── ...
├── components/                  # Reusable React components
│   ├── AnalyticsCharts.tsx      # Chart visualizations
│   ├── KPICards.tsx             # KPI displays
│   ├── AnalyticsLists.tsx       # Ranking lists
│   └── ...
├── src/
│   ├── utils/                   # Utility functions
│   │   ├── analytics.ts         # Analytics calculations
│   │   └── costs.ts             # Cost formatting
│   ├── hooks/                   # Custom React hooks
│   │   └── useFirestore.ts      # Firestore data access
│   ├── services/                # Business logic
│   │   ├── firestore.ts         # Firestore operations
│   │   └── storage.ts           # Firebase storage
│   └── ...
├── types/                       # TypeScript type definitions
├── lib/                         # External library configurations
├── assets/                      # Images and fonts
└── package.json                 # Project dependencies
```

## Technology Stack

- **Frontend**: React Native + Expo
- **Navigation**: Expo Router
- **Database**: Firebase Firestore
- **Storage**: Firebase Cloud Storage
- **Charts**: react-native-chart-kit
- **Language**: TypeScript
- **Icons**: @expo/vector-icons

## Available Scripts

```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web

# Lint code
npm run lint

# Run analytics verification
node scripts/check-analytics.js
```

## Data Flow

```
Firestore (Real-time Database)
    ↓
React Components (UI Layer)
    ↓
Custom Hooks (Data Management)
    ↓
Utility Functions (Business Logic)
    ↓
Analytics Engine (Calculations)
    ↓
Chart/List Components (Visualization)
```

## Key Components

### Order Management
- View orders with full details
- Track order status (In Progress, Preparing, Delivered)
- View ingredients used in orders
- Search and filter orders

### Dish Management
- Browse all available dishes
- View ingredient breakdowns
- Edit dish details and images
- Manage preparation times

### Client Management
- Maintain client database
- Track order history
- Upload client photos
- View spending history

### Analytics
- Real-time KPI tracking
- Revenue trend analysis
- Top performer identification
- Inventory management insights

## Features in Detail

### Dashboard
Quick overview with:
- Today's revenue
- Active orders count
- Total clients
- Orders placed today
- Recent orders
- Popular dishes

### Orders
- Create new orders
- View order details
- Edit order status
- View ingredients used
- Track delivery times
- Filter and search

### Dishes
- Browse menu items
- View ingredients and costs
- Edit dish information
- Upload dish images
- Manage preparation times
- Delete dishes

### Clients
- Add new clients
- View client details
- Upload client photos
- Track order history
- Monitor spending

### Ingredients
- Manage inventory
- View ingredient costs
- Track ingredient usage
- Edit ingredient details

## Setup Instructions

### Firebase Configuration
1. Create a Firebase project
2. Enable Firestore Database
3. Enable Cloud Storage
4. Add your Firebase config to `lib/firebase.ts`

### Environment
No environment variables needed - configuration is in the code.

## Performance

- Optimized with React hooks and memoization
- Real-time updates via Firestore listeners
- Lazy loading of images
- Efficient list rendering

## Troubleshooting

### Common Issues
- **App won't start**: Run `npm install` to install dependencies
- **Firebase errors**: Check Firebase configuration in `lib/firebase.ts`
- **Image not loading**: Verify Firebase Storage permissions
- **Analytics not updating**: Check Firestore connection

### Getting Help
1. Check the documentation files
2. Review component comments
3. Check TypeScript types for requirements
4. Enable Firebase logging for debugging

## Performance Tips

1. Use Analytics to identify slow periods
2. Manage inventory with Ingredient Usage tracking
3. Track top performers to optimize menu
4. Monitor client spending for promotions
5. Keep preparation times updated

## Future Enhancements

- [ ] Date range filtering in analytics
- [ ] Export reports to PDF/Excel
- [ ] Custom alerts for anomalies
- [ ] Staff performance metrics
- [ ] Predictive analytics
- [ ] Multi-restaurant support
- [ ] Payment integration
- [ ] SMS notifications

## License

This project is created for learning and commercial purposes.

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
