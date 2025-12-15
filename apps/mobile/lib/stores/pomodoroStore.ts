/**
 * Pomodoro Store
 *
 * Timer state management using Zustand.
 * Handles pomodoro timer state, API sync, and completion callbacks.
 * This state survives navigation but not app restarts (ephemeral).
 */
import { create } from 'zustand';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';

/** Default pomodoro duration in seconds (25 minutes) */
const DEFAULT_DURATION = 25 * 60;

/** Short break duration in seconds (5 minutes) */
const SHORT_BREAK_DURATION = 5 * 60;

/** Long break duration in seconds (15 minutes) */
const LONG_BREAK_DURATION = 15 * 60;

export interface PomodoroSettings {
  /** Duration in minutes */
  durationMinutes: number;
  /** Whether to play sound on complete */
  soundEnabled: boolean;
  /** Whether to vibrate on complete */
  vibrationEnabled: boolean;
  /** Whether to show notification on complete */
  notificationEnabled: boolean;
}

interface PomodoroState {
  /** Whether the timer is currently active */
  isActive: boolean;
  /** Associated note ID (if tracking against a task) */
  noteId: string | null;
  /** Associated note title for display */
  noteTitle: string | null;
  /** Backend session ID */
  sessionId: string | null;
  /** Timestamp when timer was started */
  startedAt: number | null;
  /** Total duration in seconds */
  duration: number;
  /** Remaining time in seconds */
  remaining: number;
  /** Whether the timer is paused */
  isPaused: boolean;
  /** Whether the overlay is expanded (vs minimized pill) */
  isExpanded: boolean;
  /** User settings */
  settings: PomodoroSettings;
  /** Timer interval ID (internal) */
  _intervalId: NodeJS.Timeout | null;
}

interface PomodoroActions {
  /**
   * Start a new pomodoro session.
   * @param noteId Optional note ID to associate with the session
   * @param noteTitle Optional note title for display
   * @param sessionId Backend session ID
   * @param durationMinutes Optional custom duration in minutes (default from settings)
   */
  start: (noteId?: string, noteTitle?: string, sessionId?: string, durationMinutes?: number) => void;

  /**
   * Pause the timer.
   */
  pause: () => void;

  /**
   * Resume a paused timer.
   */
  resume: () => void;

  /**
   * Stop and reset the timer.
   * @param onComplete Callback when stopping (for API sync)
   */
  stop: (onComplete?: (sessionId: string, completed: boolean) => Promise<void>) => void;

  /**
   * Mark timer as completed (called when remaining reaches 0).
   */
  complete: (onComplete?: (sessionId: string, completed: boolean) => Promise<void>) => void;

  /**
   * Toggle between expanded and minimized view.
   */
  toggleExpanded: () => void;

  /**
   * Update settings.
   */
  updateSettings: (settings: Partial<PomodoroSettings>) => void;

  /**
   * Internal: Start the timer interval.
   */
  _startInterval: () => void;

  /**
   * Internal: Clear the timer interval.
   */
  _clearInterval: () => void;

  /**
   * Internal: Tick handler called every second.
   */
  _tick: () => void;
}

type PomodoroStore = PomodoroState & PomodoroActions;

const defaultSettings: PomodoroSettings = {
  durationMinutes: 25,
  soundEnabled: true,
  vibrationEnabled: true,
  notificationEnabled: true,
};

const initialState: Omit<PomodoroState, '_intervalId'> = {
  isActive: false,
  noteId: null,
  noteTitle: null,
  sessionId: null,
  startedAt: null,
  duration: DEFAULT_DURATION,
  remaining: DEFAULT_DURATION,
  isPaused: false,
  isExpanded: true,
  settings: defaultSettings,
};

/**
 * Play completion haptics
 */
async function playCompletionHaptics() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    console.warn('Haptics not available:', error);
  }
}

/**
 * Show completion notification
 */
async function showCompletionNotification(noteTitle?: string | null) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🍅 Pomodoro Complete!',
        body: noteTitle
          ? `Great work on "${noteTitle}"! Time for a break.`
          : 'Great work! Time for a break.',
        sound: 'default',
      },
      trigger: null, // Show immediately
    });
  } catch (error) {
    console.warn('Failed to show notification:', error);
  }
}

/**
 * Store singleton to access from _tick
 */
let storeInstance: PomodoroStore | null = null;

/**
 * Pomodoro timer store.
 * Ephemeral state - not persisted between app restarts.
 */
export const usePomodoroStore = create<PomodoroStore>((set, get) => {
  const store: PomodoroStore = {
    ...initialState,
    _intervalId: null,

    start: (noteId?: string, noteTitle?: string, sessionId?: string, durationMinutes?: number) => {
      const { _clearInterval, _startInterval, settings } = get();

      // Clear any existing interval
      _clearInterval();

      const minutes = durationMinutes ?? settings.durationMinutes;
      const timerDuration = minutes * 60;

      set({
        isActive: true,
        noteId: noteId ?? null,
        noteTitle: noteTitle ?? null,
        sessionId: sessionId ?? null,
        startedAt: Date.now(),
        duration: timerDuration,
        remaining: timerDuration,
        isPaused: false,
        isExpanded: true,
      });

      // Start the interval
      _startInterval();
    },

    pause: () => {
      const { isActive, isPaused, _clearInterval } = get();
      if (isActive && !isPaused) {
        _clearInterval();
        set({ isPaused: true });
      }
    },

    resume: () => {
      const { isActive, isPaused, _startInterval } = get();
      if (isActive && isPaused) {
        set({ isPaused: false });
        _startInterval();
      }
    },

    stop: async (onComplete) => {
      const { sessionId, _clearInterval } = get();

      _clearInterval();

      // Call API to record the cancelled session
      if (sessionId && onComplete) {
        try {
          await onComplete(sessionId, false);
        } catch (error) {
          console.error('Failed to stop pomodoro session:', error);
        }
      }

      set({
        ...initialState,
        settings: get().settings, // Preserve settings
      });
    },

    complete: async (onComplete) => {
      const { sessionId, noteTitle, settings, _clearInterval } = get();

      _clearInterval();

      // Play completion effects
      if (settings.vibrationEnabled) {
        await playCompletionHaptics();
      }

      if (settings.notificationEnabled) {
        await showCompletionNotification(noteTitle);
      }

      // Call API to record the completed session
      if (sessionId && onComplete) {
        try {
          await onComplete(sessionId, true);
        } catch (error) {
          console.error('Failed to complete pomodoro session:', error);
        }
      }

      set({
        ...initialState,
        settings: get().settings, // Preserve settings
      });
    },

    toggleExpanded: () => {
      set((state) => ({ isExpanded: !state.isExpanded }));
    },

    updateSettings: (newSettings: Partial<PomodoroSettings>) => {
      set((state) => ({
        settings: { ...state.settings, ...newSettings },
      }));
    },

    _startInterval: () => {
      const { _intervalId } = get();

      // Clear existing interval if any
      if (_intervalId) {
        clearInterval(_intervalId);
      }

      // Create new interval
      const id = setInterval(() => {
        const state = get();
        if (state.isActive && !state.isPaused) {
          state._tick();
        }
      }, 1000);

      set({ _intervalId: id });
    },

    _clearInterval: () => {
      const { _intervalId } = get();
      if (_intervalId) {
        clearInterval(_intervalId);
        set({ _intervalId: null });
      }
    },

    _tick: () => {
      const { isActive, isPaused, remaining, complete } = get();

      // Guard: only tick when active and not paused
      if (!isActive || isPaused) {
        return;
      }

      if (remaining <= 1) {
        // Timer complete
        complete();
      } else {
        set({ remaining: remaining - 1 });
      }
    },
  };

  storeInstance = store;
  return store;
});

/**
 * Format seconds to MM:SS display
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate progress percentage (0-1)
 */
export function calculateProgress(remaining: number, duration: number): number {
  if (duration === 0) return 0;
  return (duration - remaining) / duration;
}
