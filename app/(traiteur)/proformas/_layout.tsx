import React from 'react';
import { Stack } from 'expo-router';

export default function ProformasLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="create-from-simulation" />
    </Stack>
  );
}