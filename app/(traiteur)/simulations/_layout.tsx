import React from 'react';
import { Stack } from 'expo-router';

export default function SimulationsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          
          title: 'Simulations',
        }}
      />

      <Stack.Screen
        name="new"
        options={{
          title: 'Nouvelle simulation',
        }}
      />

      <Stack.Screen
        name="[id]"
        options={{
          title: 'Détail simulation',
        }}
      />
    </Stack>
  );
}