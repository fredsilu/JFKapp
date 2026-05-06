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
    <Tabs>
  <Tabs.Screen
    name="index"
    options={{
      title: "Accueil",
    }}
  />

  <Tabs.Screen
    name="sales/index"
    options={{
      title: "Ventes",
    }}
  />

  <Tabs.Screen
    name="config/index"
    options={{
      title: "Config.",
    }}
  />

  <Tabs.Screen
    name="stats/index"
    options={{
      title: "Stats",
    }}
  />

  {/* Routes cachées */}
  <Tabs.Screen name="simulations/index" options={{ href: null }} />
  <Tabs.Screen name="simulations/new" options={{ href: null }} />

  <Tabs.Screen name="proformas/index" options={{ href: null }} />
  <Tabs.Screen name="proformas/[id]" options={{ href: null }} />

  <Tabs.Screen name="orders/index" options={{ href: null }} />
  <Tabs.Screen name="orders/[id]" options={{ href: null }} />

  <Tabs.Screen name="invoices/index" options={{ href: null }} />
  <Tabs.Screen name="invoices/[id]" options={{ href: null }} />

  <Tabs.Screen name="clients/index" options={{ href: null }} />
  <Tabs.Screen name="dishes/index" options={{ href: null }} />
</Tabs>
  );
}