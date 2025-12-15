/**
 * Pomodoro Background Service
 *
 * Handles background timer functionality using:
 * - AppState for detecting app backgrounding
 * - Scheduled notifications as backup timer
 * - Persisted state for recovery after app kill
 *
 * Note: True background task execution requires expo-task-manager.
 * This implementation uses a simpler approach with scheduled notifications
 * that works well for Pomodoro timers.
 */
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePomodoroStore } from '@/lib/stores/pomodoroStore';

const POMODORO_STORAGE_KEY = '@pomodoro_session';
const POMODORO_NOTIFICATION_ID = 'pomodoro-completion';

interface PersistedPomodoroSession {
  noteId: string | null;
  noteTitle: string | null;
  sessionId: string | null;
  startedAt: number;
  duration: number;
  isPaused: boolean;
  pausedAt: number | null;
  accumulatedPausedTime: number;
}

/**
 * Schedule a notification for when the Pomodoro timer completes.
 */
export async function scheduleCompletionNotification(
  secondsRemaining: number,
  noteTitle?: string | null
): Promise<string | null> {
  try {
    // Cancel any existing scheduled notification
    await cancelCompletionNotification();

    if (secondsRemaining <= 0) return null;

    // Schedule notification for when timer completes
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🍅 Pomodoro Complete!',
        body: noteTitle
          ? `Great work on "${noteTitle}"! Time for a break.`
          : 'Great work! Time for a break.',
        sound: 'default',
        data: {
          type: 'pomodoro_complete',
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsRemaining,
      },
      identifier: POMODORO_NOTIFICATION_ID,
    });

    return identifier;
  } catch (error) {
    console.error('Failed to schedule completion notification:', error);
    return null;
  }
}

/**
 * Cancel the scheduled completion notification.
 */
export async function cancelCompletionNotification(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(POMODORO_NOTIFICATION_ID);
  } catch (error) {
    // Notification might not exist, that's okay
  }
}

/**
 * Persist the current Pomodoro session to storage.
 */
export async function persistSession(session: PersistedPomodoroSession): Promise<void> {
  try {
    await AsyncStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to persist Pomodoro session:', error);
  }
}

/**
 * Load a persisted Pomodoro session from storage.
 */
export async function loadPersistedSession(): Promise<PersistedPomodoroSession | null> {
  try {
    const data = await AsyncStorage.getItem(POMODORO_STORAGE_KEY);
    if (data) {
      return JSON.parse(data) as PersistedPomodoroSession;
    }
    return null;
  } catch (error) {
    console.error('Failed to load persisted Pomodoro session:', error);
    return null;
  }
}

/**
 * Clear the persisted Pomodoro session.
 */
export async function clearPersistedSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(POMODORO_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear persisted Pomodoro session:', error);
  }
}

/**
 * Calculate remaining time based on persisted session.
 */
export function calculateRemainingTime(session: PersistedPomodoroSession): number {
  const now = Date.now();
  let elapsedTime: number;

  if (session.isPaused && session.pausedAt) {
    // If paused, calculate time elapsed before pause
    elapsedTime = (session.pausedAt - session.startedAt - session.accumulatedPausedTime) / 1000;
  } else {
    // If running, calculate time elapsed minus paused time
    elapsedTime = (now - session.startedAt - session.accumulatedPausedTime) / 1000;
  }

  const remaining = Math.max(0, session.duration - Math.floor(elapsedTime));
  return remaining;
}

/**
 * Initialize background handling for the Pomodoro timer.
 * Sets up AppState listeners to handle backgrounding.
 */
export function initializePomodoroBackground(): () => void {
  let appStateSubscription: ReturnType<typeof AppState.addEventListener>;

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    const store = usePomodoroStore.getState();

    if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App going to background
      if (store.isActive && !store.isPaused) {
        // Schedule notification for completion
        await scheduleCompletionNotification(store.remaining, store.noteTitle);

        // Persist session
        await persistSession({
          noteId: store.noteId,
          noteTitle: store.noteTitle,
          sessionId: store.sessionId,
          startedAt: store.startedAt ?? Date.now(),
          duration: store.duration,
          isPaused: store.isPaused,
          pausedAt: null,
          accumulatedPausedTime: 0,
        });
      }
    } else if (nextAppState === 'active') {
      // App coming to foreground
      if (store.isActive) {
        // Cancel scheduled notification since we're back
        await cancelCompletionNotification();

        // Recalculate remaining time
        const persisted = await loadPersistedSession();
        if (persisted) {
          const remaining = calculateRemainingTime(persisted);

          if (remaining <= 0) {
            // Timer completed while in background
            store.complete();
          } else {
            // Update remaining time in store
            usePomodoroStore.setState({ remaining });
          }
        }
      }
    }
  };

  appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

  // Return cleanup function
  return () => {
    appStateSubscription.remove();
  };
}

/**
 * Recover a Pomodoro session after app restart.
 * Returns true if a session was recovered.
 */
export async function recoverPomodoroSession(): Promise<boolean> {
  const persisted = await loadPersistedSession();

  if (!persisted) {
    return false;
  }

  const remaining = calculateRemainingTime(persisted);

  if (remaining <= 0) {
    // Session completed, clean up
    await clearPersistedSession();
    return false;
  }

  // Restore session to store
  const store = usePomodoroStore.getState();
  store.start(
    persisted.noteId ?? undefined,
    persisted.noteTitle ?? undefined,
    persisted.sessionId ?? undefined,
    Math.ceil(persisted.duration / 60)
  );

  // Adjust remaining time
  usePomodoroStore.setState({ remaining });

  return true;
}

