import React from 'react';
import { Stack } from 'expo-router';

export default function ProformasLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: 'Proformas' }}
      />

      <Stack.Screen
        name="[id]"
        options={{ title: 'Détail proforma' }}
      />

      <Stack.Screen
        name="create-from-simulation"
        options={{ title: 'Créer proforma' }}
      />
    </Stack>
  );
}