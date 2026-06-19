// app/(traiteur)/_layout.tsx
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Tabs } from 'expo-router';
import { MaterialIcons as Icon } from '@expo/vector-icons';

import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';

const hiddenScreenOptions = {
  href: null,
  headerShown: false,
};

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
      backBehavior="history"
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

      <Tabs.Screen name="tools" options={hiddenScreenOptions} />
      <Tabs.Screen
        name="tools/calculator"
        options={{
          href: null,
          headerShown: false,
        }}
      />

      <Tabs.Screen name="simulations" options={hiddenScreenOptions} />
      <Tabs.Screen name="simulations/index" options={hiddenScreenOptions} />
      <Tabs.Screen name="simulations/new" options={hiddenScreenOptions} />
      <Tabs.Screen name="simulations/[id]" options={hiddenScreenOptions} />

      <Tabs.Screen name="proformas" options={hiddenScreenOptions} />
      <Tabs.Screen name="proformas/index" options={hiddenScreenOptions} />
      <Tabs.Screen name="proformas/[id]" options={hiddenScreenOptions} />
      <Tabs.Screen
        name="proformas/create-from-simulation"
        options={hiddenScreenOptions}
      />

      <Tabs.Screen name="orders" options={hiddenScreenOptions} />
      <Tabs.Screen name="orders/index" options={hiddenScreenOptions} />
      <Tabs.Screen name="orders/new" options={hiddenScreenOptions} />
      <Tabs.Screen name="orders/[id]" options={hiddenScreenOptions} />
      <Tabs.Screen name="orders/from-simulation" options={hiddenScreenOptions} />
      <Tabs.Screen name="orders/operational/[id]" options={hiddenScreenOptions} />

      <Tabs.Screen name="invoices" options={hiddenScreenOptions} />
      <Tabs.Screen name="invoices/index" options={hiddenScreenOptions} />
      <Tabs.Screen name="invoices/[id]" options={hiddenScreenOptions} />
      <Tabs.Screen name="invoices/cancel/[id]" options={hiddenScreenOptions} />
      <Tabs.Screen
        name="invoices/credit-note/[id]"
        options={hiddenScreenOptions}
      />
      <Tabs.Screen name="invoices/history/[id]" options={hiddenScreenOptions} />
      <Tabs.Screen name="invoices/replace/[id]" options={hiddenScreenOptions} />
      <Tabs.Screen name="invoices/edit/[id]" options={hiddenScreenOptions} />
      <Tabs.Screen name="invoices/credit-note/view/[id]" options={hiddenScreenOptions} />
      <Tabs.Screen
        name="invoices/credit-note/edit/[id]"
        options={hiddenScreenOptions}
      />
      <Tabs.Screen name="invoices/edit-v2/[id]" options={hiddenScreenOptions} />

      <Tabs.Screen name="clients" options={hiddenScreenOptions} />
      <Tabs.Screen name="clients/index" options={hiddenScreenOptions} />
      <Tabs.Screen name="clients/[id]" options={hiddenScreenOptions} />

      <Tabs.Screen name="dishes" options={hiddenScreenOptions} />
      <Tabs.Screen name="dishes/index" options={hiddenScreenOptions} />
      <Tabs.Screen name="dishes/[id]" options={hiddenScreenOptions} />

      <Tabs.Screen name="ingredients" options={hiddenScreenOptions} />
      <Tabs.Screen name="ingredients/index" options={hiddenScreenOptions} />
      <Tabs.Screen name="ingredients/[id]" options={hiddenScreenOptions} />

      <Tabs.Screen name="analytics" options={hiddenScreenOptions} />
      <Tabs.Screen name="analytics/index" options={hiddenScreenOptions} />

      <Tabs.Screen name="documents" options={hiddenScreenOptions} />
      <Tabs.Screen name="documents/editor" options={hiddenScreenOptions} />
      <Tabs.Screen name="documents/index" options={hiddenScreenOptions} />
      <Tabs.Screen name="documents/invoices" options={hiddenScreenOptions} />
      <Tabs.Screen name="documents/proformas" options={hiddenScreenOptions} />
      <Tabs.Screen name="documents/credit-notes" options={hiddenScreenOptions} />


      <Tabs.Screen name="config/help" options={hiddenScreenOptions} />
      <Tabs.Screen name="config/service-settings" options={hiddenScreenOptions} />
      <Tabs.Screen name="config/numbering" options={hiddenScreenOptions} />
    </Tabs>
  );
}