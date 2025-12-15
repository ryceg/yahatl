/**
 * Notification Store
 *
 * Manages push notification state including:
 * - Push token storage
 * - Permission status
 * - Foreground notification display
 * - Token refresh handling
 */
import { create } from 'zustand';
import * as Notifications from 'expo-notifications';
import {
  initializePushNotifications,
  unregisterPushToken,
  getExpoPushToken,
  registerPushTokenWithBackend,
  handleNotificationTap,
  addNotificationResponseListener,
  addNotificationReceivedListener,
  getLastNotificationResponse,
} from '@/lib/services/notifications';

interface NotificationState {
  /** The Expo push token for this device */
  pushToken: string | null;
  /** Whether notification permissions are granted */
  hasPermission: boolean;
  /** Whether notifications are currently being initialized */
  isInitializing: boolean;
  /** Error message if initialization failed */
  error: string | null;
  /** Current foreground notification (for in-app banner) */
  foregroundNotification: Notifications.Notification | null;
  /** Whether the in-app notification banner is visible */
  isBannerVisible: boolean;
}

interface NotificationActions {
  /**
   * Initialize push notifications.
   * Should be called after successful login.
   */
  initialize: () => Promise<void>;

  /**
   * Cleanup notifications on logout.
   * Unregisters the token from the backend.
   */
  cleanup: () => Promise<void>;

  /**
   * Refresh the push token.
   * Call this when the token changes.
   */
  refreshToken: () => Promise<void>;

  /**
   * Show a foreground notification in the in-app banner.
   */
  showForegroundNotification: (notification: Notifications.Notification) => void;

  /**
   * Dismiss the in-app notification banner.
   */
  dismissBanner: () => void;

  /**
   * Set up notification listeners.
   * Returns cleanup function to remove listeners.
   */
  setupListeners: () => () => void;
}

type NotificationStore = NotificationState & NotificationActions;

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  // Initial state
  pushToken: null,
  hasPermission: false,
  isInitializing: false,
  error: null,
  foregroundNotification: null,
  isBannerVisible: false,

  initialize: async () => {
    if (get().isInitializing) return;

    set({ isInitializing: true, error: null });

    try {
      const token = await initializePushNotifications();

      set({
        pushToken: token,
        hasPermission: token !== null,
        isInitializing: false,
      });

      // Check if app was opened from a notification
      const lastResponse = await getLastNotificationResponse();
      if (lastResponse) {
        handleNotificationTap(lastResponse);
      }
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      set({
        isInitializing: false,
        error: error instanceof Error ? error.message : 'Failed to initialize notifications',
      });
    }
  },

  cleanup: async () => {
    const { pushToken } = get();

    if (pushToken) {
      await unregisterPushToken();
    }

    set({
      pushToken: null,
      hasPermission: false,
      error: null,
      foregroundNotification: null,
      isBannerVisible: false,
    });
  },

  refreshToken: async () => {
    try {
      const newToken = await getExpoPushToken();

      if (newToken && newToken !== get().pushToken) {
        await registerPushTokenWithBackend(newToken);
        set({ pushToken: newToken });
        console.log('Push token refreshed and registered');
      }
    } catch (error) {
      console.error('Failed to refresh push token:', error);
    }
  },

  showForegroundNotification: (notification: Notifications.Notification) => {
    set({
      foregroundNotification: notification,
      isBannerVisible: true,
    });

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      const { foregroundNotification } = get();
      // Only dismiss if it's the same notification
      if (foregroundNotification?.request.identifier === notification.request.identifier) {
        set({ isBannerVisible: false });
      }
    }, 5000);
  },

  dismissBanner: () => {
    set({ isBannerVisible: false });
  },

  setupListeners: () => {
    // Listen for notifications received while app is in foreground
    const notificationReceivedSubscription = addNotificationReceivedListener(
      (notification) => {
        get().showForegroundNotification(notification);
      }
    );

    // Listen for notification taps
    const notificationResponseSubscription = addNotificationResponseListener(
      (response) => {
        get().dismissBanner();
        handleNotificationTap(response);
      }
    );

    // Return cleanup function
    return () => {
      notificationReceivedSubscription.remove();
      notificationResponseSubscription.remove();
    };
  },
}));

