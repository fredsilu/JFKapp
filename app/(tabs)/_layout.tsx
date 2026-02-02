import { Tabs } from 'expo-router';
import React from 'react';
//import Icon from 'react-native-vector-icons/MaterialIcons'; // Import MaterialIcons
import { MaterialIcons as Icon } from '@expo/vector-icons';


export default function TabLayout() {
  //const colorScheme = useColorScheme();

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
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Icon name="dashboard" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clients',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Icon name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ingredients"
        options={{
          title: 'Ingrédients',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Icon name="local-cafe" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dishes"
        options={{
          title: 'Plats',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Icon name="book" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Commandes',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Icon name="shopping-bag" size={size} color={color} />,
        }}
      />
     <Tabs.Screen
  name="catering-simulations"
  options={{
    title: 'Simulations',
    tabBarIcon: ({ color, size }) => (
      <Icon name="calculate" size={size} color={color} />
    ),
  }}
/>


   
     
    </Tabs>
  );
}
