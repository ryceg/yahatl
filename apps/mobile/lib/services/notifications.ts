/**
 * Push Notification Service
 *
 * Handles all push notification functionality including:
 * - Permission requests
 * - Push token registration
 * - Android notification channels
 * - Foreground notification handling
 * - Notification tap navigation
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { PushTokenClient, API_BASE_URL, RegisterPushTokenRequest } from '@/lib/api/client';

/**
 * Notification channel IDs for Android
 */
export const NotificationChannels = {
  REMINDERS: 'reminders',
  STREAKS: 'streaks',
  GENERAL: 'general',
} as const;

/**
 * Configure notification handler for foreground notifications
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Sets up Android notification channels with appropriate priorities
 */
async function setupAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  // Reminders channel - high priority for time-sensitive notifications
  await Notifications.setNotificationChannelAsync(NotificationChannels.REMINDERS, {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    description: 'Important reminders and time-sensitive notifications',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#7c3aed', // Primary purple color
    sound: 'default',
    enableVibrate: true,
    enableLights: true,
  });

  // Streaks channel - default priority for habit tracking
  await Notifications.setNotificationChannelAsync(NotificationChannels.STREAKS, {
    name: 'Streaks',
    importance: Notifications.AndroidImportance.DEFAULT,
    description: 'Habit streak notifications and daily reminders',
    vibrationPattern: [0, 100, 100, 100],
    lightColor: '#10b981', // Green for positive reinforcement
    sound: 'default',
    enableVibrate: true,
    enableLights: true,
  });

  // General channel - low priority for non-urgent updates
  await Notifications.setNotificationChannelAsync(NotificationChannels.GENERAL, {
    name: 'General',
    importance: Notifications.AndroidImportance.LOW,
    description: 'General updates and information',
    enableVibrate: false,
    enableLights: false,
  });
}

/**
 * Request notification permissions from the user
 * @returns Permission status granted or not
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  // Only physical devices can receive push notifications
  if (!Device.isDevice) {
    console.log('Push notifications are only available on physical devices');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permissions not granted');
    return false;
  }

  return true;
}

/**
 * Get the Expo push token for this device
 * @returns The Expo push token string, or null if unavailable
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    // Setup Android channels first
    await setupAndroidChannels();

    // Request permissions
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    // Get the token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });

    return tokenData.data;
  } catch (error) {
    console.error('Failed to get push token:', error);
    return null;
  }
}

/**
 * Register the push token with the backend
 * @param pushToken The Expo push token to register
 * @returns Success status
 */
export async function registerPushTokenWithBackend(pushToken: string): Promise<boolean> {
  try {
    const client = new PushTokenClient(API_BASE_URL);
    const request: RegisterPushTokenRequest = { pushToken };
    await client.registerPushToken(request);
    console.log('Push token registered with backend successfully');
    return true;
  } catch (error) {
    console.error('Failed to register push token with backend:', error);
    return false;
  }
}

/**
 * Unregister the push token from the backend (called on logout)
 * @returns Success status
 */
export async function unregisterPushToken(): Promise<boolean> {
  try {
    const client = new PushTokenClient(API_BASE_URL);
    await client.unregisterPushToken();
    console.log('Push token unregistered from backend successfully');
    return true;
  } catch (error) {
    console.error('Failed to unregister push token from backend:', error);
    return false;
  }
}

/**
 * Handle navigation when a notification is tapped
 * @param notification The notification response from the tap
 */
export function handleNotificationTap(response: Notifications.NotificationResponse): void {
  const data = response.notification.request.content.data;

  // Navigate based on the notification data
  if (data?.noteId && typeof data.noteId === 'string') {
    // Navigate to the specific note
    router.push(`/notes/${data.noteId}`);
  } else if (data?.screen && typeof data.screen === 'string') {
    // Navigate to a specific screen
    router.push(data.screen as any);
  }
  // If no navigation data, just open the app (default behavior)
}

/**
 * Initialize push notifications
 * Should be called after successful login
 * @returns The push token if successful, null otherwise
 */
export async function initializePushNotifications(): Promise<string | null> {
  const token = await getExpoPushToken();

  if (token) {
    await registerPushTokenWithBackend(token);
  }

  return token;
}

/**
 * Create notification response listener subscription
 * @param callback Function to call when notification is tapped
 * @returns Subscription that should be removed on cleanup
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Create notification received listener subscription (foreground)
 * @param callback Function to call when notification is received
 * @returns Subscription that should be removed on cleanup
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Get the last notification response (for handling app opens from notifications)
 * @returns The last notification response if the app was opened from a notification
 */
export async function getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  return await Notifications.getLastNotificationResponseAsync();
}

