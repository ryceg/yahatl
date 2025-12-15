import '../global.css';
import { useEffect, useCallback, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View, ActivityIndicator, Text } from 'react-native';
import { PortalHost } from '@rn-primitives/portal';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/api/queryClient';
import { useAuthStore } from '@/lib/stores/authStore';
import { useNotificationStore } from '@/lib/stores/notificationStore';
import { NotificationBanner } from '@/components/common/NotificationBanner';
import { PomodoroOverlay } from '@/components/pomodoro';
import { initializePomodoroBackground } from '@/lib/services/pomodoroBackground';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();

  // Get auth state from store
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const initialize = useAuthStore((state) => state.initialize);

  // Get notification actions from store
  const initializeNotifications = useNotificationStore((state) => state.initialize);
  const setupNotificationListeners = useNotificationStore((state) => state.setupListeners);
  const cleanupNotifications = useNotificationStore((state) => state.cleanup);

  // Track if notifications have been initialized to prevent duplicate initialization
  const notificationsInitializedRef = useRef(false);
  // Track if pomodoro background is initialized
  const pomodoroBackgroundRef = useRef<(() => void) | null>(null);

  // Initialize auth state on app start
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Initialize Pomodoro background handling
  useEffect(() => {
    if (isAuthenticated && !pomodoroBackgroundRef.current) {
      pomodoroBackgroundRef.current = initializePomodoroBackground();
    }

    return () => {
      if (pomodoroBackgroundRef.current) {
        pomodoroBackgroundRef.current();
        pomodoroBackgroundRef.current = null;
      }
    };
  }, [isAuthenticated]);

  // Initialize push notifications when user is authenticated
  useEffect(() => {
    if (isInitialized && isAuthenticated && !notificationsInitializedRef.current) {
      notificationsInitializedRef.current = true;
      initializeNotifications();
    } else if (isInitialized && !isAuthenticated && notificationsInitializedRef.current) {
      notificationsInitializedRef.current = false;
      cleanupNotifications();
    }
  }, [isInitialized, isAuthenticated, initializeNotifications, cleanupNotifications]);

  // Set up notification listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    const cleanup = setupNotificationListeners();
    return cleanup;
  }, [isAuthenticated, setupNotificationListeners]);

  const onLayoutRootView = useCallback(async () => {
    if (isInitialized) {
      await SplashScreen.hideAsync();
    }
  }, [isInitialized]);

  // Auth redirect logic
  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to main app if already authenticated
      router.replace('/(tabs)/planner');
    }
  }, [isAuthenticated, segments, isInitialized, router]);

  // Show loading screen during auth initialization
  if (!isInitialized) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{
          backgroundColor:
            colorScheme === 'dark'
              ? 'hsl(240, 10%, 3.9%)'
              : 'hsl(0, 0%, 100%)',
        }}
      >
        <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#fff' : '#000'} />
        <Text
          className="mt-4 text-muted-foreground"
          style={{ color: colorScheme === 'dark' ? '#999' : '#666' }}
        >
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1" onLayout={onLayoutRootView}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor:
              colorScheme === 'dark'
                ? 'hsl(240, 10%, 3.9%)'
                : 'hsl(0, 0%, 100%)',
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen
          name="notes/[id]"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="notes/new"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
      <NotificationBanner />
      <PomodoroOverlay />
      <PortalHost />
    </View>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}
