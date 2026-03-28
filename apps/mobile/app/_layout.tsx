import { useEffect, useCallback } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { colors } from '../src/theme';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

function RootNavigator() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontFamily: 'PlusJakartaSans_600SemiBold' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="listing/[id]"
        options={{
          headerShown: true,
          headerTitle: 'İlan Detayı',
          headerBackTitle: 'Geri',
        }}
      />
      <Stack.Screen
        name="offer/[id]"
        options={{
          headerShown: true,
          headerTitle: 'Teklif Detayı',
          headerBackTitle: 'Geri',
        }}
      />
      <Stack.Screen
        name="conversation/[id]"
        options={{
          headerShown: true,
          headerTitle: 'Mesaj',
          headerBackTitle: 'Geri',
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          headerShown: true,
          headerTitle: 'Bildirimler',
          headerBackTitle: 'Geri',
        }}
      />
      <Stack.Screen
        name="saved"
        options={{
          headerShown: true,
          headerTitle: 'Favorilerim',
          headerBackTitle: 'Geri',
        }}
      />
      <Stack.Screen
        name="orders"
        options={{
          headerShown: true,
          headerTitle: 'Siparişlerim',
          headerBackTitle: 'Geri',
        }}
      />
      <Stack.Screen
        name="plans"
        options={{
          headerShown: true,
          headerTitle: 'Planlar',
          headerBackTitle: 'Geri',
        }}
      />
      <Stack.Screen
        name="user/[id]"
        options={{
          headerShown: true,
          headerTitle: 'Profil',
          headerBackTitle: 'Geri',
        }}
      />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <StatusBar style="light" backgroundColor={colors.background} />
            <RootNavigator />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
