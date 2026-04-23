import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import ModuleButton from '@/components/ModuleButton';

export default function TraiteurLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerRight: () => <ModuleButton />,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#f5f5f5',
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <Icon name="dashboard" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clients',
          tabBarLabel: 'Clients',
          tabBarIcon: ({ color, size }) => (
            <Icon name="people" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="dishes"
        options={{
          title: 'Plats',
          tabBarLabel: 'Plats',
          tabBarIcon: ({ color, size }) => (
            <Icon name="restaurant-menu" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="simulations"
        options={{
          title: 'Simulations',
          tabBarLabel: 'Simul.',
          tabBarIcon: ({ color, size }) => (
            <Icon name="calculate" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: 'Commandes',
          tabBarLabel: 'Commandes',
          tabBarIcon: ({ color, size }) => (
            <Icon name="shopping-bag" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarLabel: 'Stats',
          tabBarIcon: ({ color, size }) => (
            <Icon name="bar-chart" size={size} color={color} />
          ),
        }}
      />

      {/* Écrans cachés mais accessibles par router.push */}
      <Tabs.Screen
        name="ingredients"
        options={{
          href: null,
          title: 'Ingrédients',
        }}
      />

      <Tabs.Screen
        name="documents"
        options={{
          href: null,
          title: 'Documents',
        }}
      />

      <Tabs.Screen
        name="tools"
        options={{
          href: null,
          title: 'Outils',
        }}
      />
    </Tabs>
  );
}