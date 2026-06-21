// app/_layout.tsx
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useSegments, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  Text,
  View,
} from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import {
  AuthProvider,
  useAuth,
} from '@/src/contexts/AuthContext';

SplashScreen.preventAutoHideAsync();

function AppLoadingScreen() {
  return (
    <View
      style={{
        flex: 1,
        minHeight: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        padding: 24,
      }}
    >
      <Image
        source={require('../assets/images/splash-icon.png')}
        resizeMode="contain"
        style={{
          width: 160,
          height: 160,
          marginBottom: 24,
        }}
      />

      <ActivityIndicator size="large" />

      <Text
        style={{
          marginTop: 16,
          fontSize: 16,
          fontWeight: '600',
          color: '#333',
        }}
      >
        Démarrage de JFKApp...
      </Text>
    </View>
  );
}

function RootNavigation() {
  const { user, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const isLoginScreen = segments[0] === 'login';

    if (!user && !isLoginScreen) {
      router.replace('/login');
    }

    if (user && isLoginScreen) {
      router.replace('/');
    }
  }, [user, loading, segments]);

  if (loading) {
    return <AppLoadingScreen />;
  }

  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="index" />
      <Stack.Screen name="(traiteur)" />
      <Stack.Screen name="(finance)" />

      <Stack.Screen
        name="preparation-ingredients"
        options={{
          title: 'Ingrédients en préparation',
          headerShown: true,
        }}
      />

      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

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
    return <AppLoadingScreen />;
  }

  return (
    <AuthProvider>
      <ThemeProvider
        value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
      >
        <RootNavigation />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}