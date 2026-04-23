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
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#f5f5f5',
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
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
        name="clients/index"
        options={{
          title: 'Clients',
          tabBarLabel: 'Clients',
          tabBarIcon: ({ color, size }) => (
            <Icon name="people" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="dishes/index"
        options={{
          title: 'Plats',
          tabBarLabel: 'Plats',
          tabBarIcon: ({ color, size }) => (
            <Icon name="restaurant-menu" size={size} color={color} />
          ),
        }}
      />

      {/* IMPORTANT : on pointe vers le dossier simulations,
          pas vers simulations/index */}
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
        name="orders/index"
        options={{
          title: 'Commandes',
          tabBarLabel: 'Commandes',
          tabBarIcon: ({ color, size }) => (
            <Icon name="shopping-bag" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
  name="proformas"
  options={{
    title: 'Proformas',
    tabBarLabel: 'Proformas',
    tabBarIcon: ({ color, size }) => (
      <Icon name="description" size={size} color={color} />
    ),
  }}
/>

      <Tabs.Screen
        name="analytics/index"
        options={{
          title: 'Analytics',
          tabBarLabel: 'Stats',
          tabBarIcon: ({ color, size }) => (
            <Icon name="bar-chart" size={size} color={color} />
          ),
        }}
      />

      {/* Écrans cachés */}
      <Tabs.Screen name="ingredients/index" options={{ href: null }} />
      <Tabs.Screen name="documents/editor" options={{ href: null }} />
      <Tabs.Screen name="tools" options={{ href: null }} />
      <Tabs.Screen name="orders/new" options={{ href: null }} />
      <Tabs.Screen name="orders/from-simulation" options={{ href: null }} />
    </Tabs>
  );
}