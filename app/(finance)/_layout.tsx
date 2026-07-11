//app/(finance)/_layout.tsx
import { Stack } from "expo-router";

export default function FinanceLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}