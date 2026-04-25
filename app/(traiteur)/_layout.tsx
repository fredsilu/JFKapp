import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';

import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
  Montserrat_900Black,
} from '@expo-google-fonts/montserrat';

export default function TraiteurLayout() {
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Montserrat_900Black,
  });

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#ffffff',
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontFamily: 'Montserrat_700Bold',
          fontSize: 16,
          color: '#111827',
        },
        headerBackTitleVisible: false,
        contentStyle: {
          backgroundColor: '#ffffff',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Traiteur',
        }}
      />

      <Stack.Screen
        name="dashboard"
        options={{
          title: 'Dashboard Traiteur',
        }}
      />

      <Stack.Screen
        name="simulations/index"
        options={{
          title: 'Simulations',
        }}
      />

      <Stack.Screen
        name="simulations/new"
        options={{
          title: 'Nouvelle simulation',
        }}
      />

      <Stack.Screen
        name="simulations/[id]"
        options={{
          title: 'Détail simulation',
        }}
      />

      <Stack.Screen
        name="proformas/index"
        options={{
          title: 'Proformas',
        }}
      />

      <Stack.Screen
        name="proformas/new"
        options={{
          title: 'Nouvelle proforma',
        }}
      />

      <Stack.Screen
        name="proformas/from-simulation"
        options={{
          title: 'Créer proforma',
        }}
      />

      <Stack.Screen
        name="proformas/[id]"
        options={{
          title: 'Détail proforma',
        }}
      />

      <Stack.Screen
        name="orders/index"
        options={{
          title: 'Commandes',
        }}
      />

      <Stack.Screen
        name="orders/new"
        options={{
          title: 'Nouvelle commande',
        }}
      />

      <Stack.Screen
        name="orders/[id]"
        options={{
          title: 'Détail commande',
        }}
      />

      <Stack.Screen
        name="invoices/index"
        options={{
          title: 'Factures',
        }}
      />

      <Stack.Screen
        name="invoices/new"
        options={{
          title: 'Nouvelle facture',
        }}
      />

      <Stack.Screen
        name="invoices/[id]"
        options={{
          title: 'Détail facture',
        }}
      />
    </Stack>
  );
}