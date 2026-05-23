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
        headerTitle: () => null,
        headerTitleAlign: 'center',
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTitleStyle: {
          fontFamily: 'Montserrat_700Bold',
          fontSize: 16,
          color: '#0F172A',
        },
        headerRight: () => <ModuleButton />,

        tabBarActiveTintColor: '#0F4C81',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
        },
        tabBarLabelStyle: {
          fontFamily: 'Montserrat_600SemiBold',
          fontSize: 11,
        },
      }}
    >
      {/* Onglets visibles */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="sales/index"
        options={{
          title: 'Ventes',
          tabBarIcon: ({ color, size }) => (
            <Icon name="point-of-sale" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="stats/index"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, size }) => (
            <Icon name="bar-chart" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="config/index"
        options={{
          title: 'Config.',
          tabBarIcon: ({ color, size }) => (
            <Icon name="settings" size={size} color={color} />
          ),
        }}
      />

      {/* Routes cachées */}
      <Tabs.Screen name="tools" options={{ href: null }} />

      <Tabs.Screen name="simulations" options={{ href: null }} />
      <Tabs.Screen
        name="simulations/index"
        options={{
          href: null,
          headerLeft: () => null,
        }}
      />
      <Tabs.Screen name="simulations/new" options={{ href: null }} />
      <Tabs.Screen name="simulations/[id]" options={{ href: null }} />

      <Tabs.Screen name="proformas" options={{ href: null }} />
      <Tabs.Screen
        name="proformas/index"
        options={{
          href: null,
          headerLeft: () => null,
         
        }}
      />
      <Tabs.Screen name="proformas/[id]" options={{ href: null }} />
      <Tabs.Screen
        name="proformas/create-from-simulation"
        options={{ href: null }}
      />

      <Tabs.Screen name="orders" options={{ href: null }} />
      <Tabs.Screen
        name="orders/index"
        options={{
          href: null,
          headerLeft: () => null,
        }}
      />
      <Tabs.Screen name="orders/new" options={{ href: null }} />
      <Tabs.Screen name="orders/[id]" options={{ href: null }} />
      <Tabs.Screen name="orders/from-simulation" options={{ href: null }} />

      <Tabs.Screen name="invoices" options={{ href: null }} />
      <Tabs.Screen
        name="invoices/index"
        options={{
          href: null,
          headerLeft: () => null,
        }}
      />
      <Tabs.Screen name="invoices/[id]" options={{ href: null }} />

      <Tabs.Screen name="clients" options={{ href: null }} />
      <Tabs.Screen
        name="clients/index"
        options={{
          href: null,
          headerLeft: () => null,
        }}
      />
      <Tabs.Screen name="clients/[id]" options={{ href: null }} />

      <Tabs.Screen name="dishes" options={{ href: null }} />
      <Tabs.Screen
        name="dishes/index"
        options={{
          href: null,
          headerLeft: () => null,
        }}
      />
      <Tabs.Screen name="dishes/[id]" options={{ href: null }} />

      <Tabs.Screen name="ingredients" options={{ href: null }} />
      <Tabs.Screen
        name="ingredients/index"
        options={{
          href: null,
          headerLeft: () => null,
        }}
      />
      <Tabs.Screen name="ingredients/[id]" options={{ href: null }} />

      <Tabs.Screen name="analytics" options={{ href: null }} />
      <Tabs.Screen name="analytics/index" options={{ href: null }} />

      <Tabs.Screen name="invoices/cancel/[id]" options={{ href: null }} />
      <Tabs.Screen name="invoices/credit-note/[id]" options={{ href: null }} />

      <Tabs.Screen name="documents" options={{ href: null }} />
      <Tabs.Screen name="documents/editor" options={{ href: null }} />

      <Tabs.Screen name="orders/operational/[id]" options={{ href: null }} />
      <Tabs.Screen name="invoices/history/[id]" options={{ href: null }} />
      <Tabs.Screen name="invoices/replace/[id]" options={{ href: null }} />
      <Tabs.Screen name="config/help" options={{ href: null }} />
    </Tabs>
  );
}