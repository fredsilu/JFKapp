import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent splash auto hide
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        initialRouteName="modules"
        screenOptions={{
          headerShown: false, // IMPORTANT : pas de header ici
        }}
      >
        {/* Sélecteur Modules */}
        <Stack.Screen name="modules" />

        {/* Routes isolées hors Tabs */}
        <Stack.Screen
          name="preparation-ingredients"
          options={{ title: 'Ingrédients en préparation', headerShown: true }}
        />

        <Stack.Screen
          name="analytics"
          options={{ title: 'Analytics', headerShown: true }}
        />

        <Stack.Screen name="+not-found" />
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}