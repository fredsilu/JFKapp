import { Tabs } from 'expo-router';
import { Chrome as Home, Users, Coffee, Book, ShoppingBag } from 'lucide-react-native';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#f5f5f5',
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tableau de bord',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clients',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ingredients"
        options={{
          title: 'Ingrédients',
          tabBarIcon: ({ color, size }) => <Coffee size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dishes"
        options={{
          title: 'Plats',
          tabBarIcon: ({ color, size }) => <Book size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Commandes',
          tabBarIcon: ({ color, size }) => <ShoppingBag size={size} color={color} />,
        }}
      />
      <Tabs.Screen 
        name="all-orders"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen 
        name="all-dishes"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}