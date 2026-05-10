// app/(traiteur)/orders/new.tsx

import { useEffect } from 'react';
import { router } from 'expo-router';

export default function DeprecatedNewOrderScreen() {
  useEffect(() => {
    router.replace('/(traiteur)/proformas');
  }, []);

  return null;
}