import React from 'react';
import { Stack } from 'expo-router';

export default function ToolsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="calculator"
        options={{
          title: 'Calculateur',
        }}
      />
    </Stack>
  );
}