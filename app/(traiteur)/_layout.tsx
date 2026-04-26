import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Tabs } from 'expo-router';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import ModuleButton from '@/components/ModuleButton';

import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';

export default function TraiteurLayout() {
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fff',
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerRight: () => <ModuleButton />,
        headerTitleStyle: {
          fontFamily: 'Montserrat_700Bold',
          fontSize: 16,
        },
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
          fontFamily: 'Montserrat_600SemiBold',
          fontSize: 11,
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
        name="invoices/index"
        options={{
          title: 'Factures',
          tabBarLabel: 'Factures',
          tabBarIcon: ({ color, size }) => (
            <Icon name="receipt-long" size={size} color={color} />
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

      <Tabs.Screen name="invoices/[id]" options={{ href: null }} />

      <Tabs.Screen name="ingredients/index" options={{ href: null }} />
      <Tabs.Screen name="documents/editor" options={{ href: null }} />
      <Tabs.Screen name="tools" options={{ href: null }} />
      <Tabs.Screen name="orders/new" options={{ href: null }} />
      <Tabs.Screen name="orders/from-simulation" options={{ href: null }} />
    </Tabs>
  );
}