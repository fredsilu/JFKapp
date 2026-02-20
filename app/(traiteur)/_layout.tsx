import { Tabs } from 'expo-router';
import React from 'react';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import ModuleButton from "@/components/ModuleButton";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true, // Header géré ici
        headerRight: () => <ModuleButton />, // Bouton Modules
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#f5f5f5',
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tableau de bord',
          tabBarIcon: ({ color, size }) => (
            <Icon name="dashboard" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clients',
          tabBarIcon: ({ color, size }) => (
            <Icon name="people" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="ingredients"
        options={{
          title: 'Ingrédients',
          tabBarIcon: ({ color, size }) => (
            <Icon name="local-cafe" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="dishes"
        options={{
          title: 'Plats',
          tabBarIcon: ({ color, size }) => (
            <Icon name="book" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: 'Commandes',
          tabBarIcon: ({ color, size }) => (
            <Icon name="shopping-bag" size={size} color={color} />
          ),
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