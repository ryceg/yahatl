import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { usePomodoroStore, formatTime, calculateProgress } from '../pomodoroStore';

const DEFAULT_DURATION = 25 * 60; // 25 minutes in seconds

// Mock expo modules
vi.mock('expo-haptics', () => ({
  notificationAsync: vi.fn(),
  NotificationFeedbackType: { Success: 'success' },
}));

vi.mock('expo-notifications', () => ({
  scheduleNotificationAsync: vi.fn(),
}));

describe('pomodoroStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    const { _clearInterval } = usePomodoroStore.getState();
    _clearInterval();

    usePomodoroStore.setState({
      isActive: false,
      noteId: null,
      noteTitle: null,
      sessionId: null,
      startedAt: null,
      duration: DEFAULT_DURATION,
      remaining: DEFAULT_DURATION,
      isPaused: false,
      isExpanded: true,
      settings: {
        durationMinutes: 25,
        soundEnabled: true,
        vibrationEnabled: true,
        notificationEnabled: true,
      },
      _intervalId: null,
    });
  });

  afterEach(() => {
    // Clean up any intervals
    const { _clearInterval } = usePomodoroStore.getState();
    _clearInterval();
    vi.clearAllMocks();
  });

  describe('start', () => {
    it('should initialize timer state', () => {
      const beforeStart = Date.now();
      usePomodoroStore.getState().start('note-123', 'Test Note', 'session-456');
      const afterStart = Date.now();

      const state = usePomodoroStore.getState();
      expect(state.isActive).toBe(true);
      expect(state.noteId).toBe('note-123');
      expect(state.noteTitle).toBe('Test Note');
      expect(state.sessionId).toBe('session-456');
      expect(state.startedAt).toBeGreaterThanOrEqual(beforeStart);
      expect(state.startedAt).toBeLessThanOrEqual(afterStart);
      expect(state.isPaused).toBe(false);
      expect(state.isExpanded).toBe(true);
    });

    it('should use default 25-minute duration from settings', () => {
      usePomodoroStore.getState().start();

      const state = usePomodoroStore.getState();
      expect(state.duration).toBe(DEFAULT_DURATION);
      expect(state.remaining).toBe(DEFAULT_DURATION);
    });

    it('should accept custom duration in minutes', () => {
      usePomodoroStore.getState().start(undefined, undefined, undefined, 15);

      const state = usePomodoroStore.getState();
      expect(state.duration).toBe(15 * 60);
      expect(state.remaining).toBe(15 * 60);
    });

    it('should set noteId to null when not provided', () => {
      usePomodoroStore.getState().start();

      expect(usePomodoroStore.getState().noteId).toBeNull();
    });

    it('should start the interval timer', () => {
      usePomodoroStore.getState().start();

      const state = usePomodoroStore.getState();
      expect(state._intervalId).not.toBeNull();
    });
  });

  describe('pause', () => {
    it('should set isPaused to true when active', () => {
      usePomodoroStore.getState().start();
      usePomodoroStore.getState().pause();

      expect(usePomodoroStore.getState().isPaused).toBe(true);
    });

    it('should clear the interval when paused', () => {
      usePomodoroStore.getState().start();
      expect(usePomodoroStore.getState()._intervalId).not.toBeNull();

      usePomodoroStore.getState().pause();
      expect(usePomodoroStore.getState()._intervalId).toBeNull();
    });

    it('should do nothing when not active', () => {
      usePomodoroStore.setState({ isActive: false, isPaused: false });

      usePomodoroStore.getState().pause();

      expect(usePomodoroStore.getState().isPaused).toBe(false);
    });

    it('should do nothing when already paused', () => {
      usePomodoroStore.setState({ isActive: true, isPaused: true });

      usePomodoroStore.getState().pause();

      expect(usePomodoroStore.getState().isPaused).toBe(true);
    });
  });

  describe('resume', () => {
    it('should set isPaused to false when paused', () => {
      usePomodoroStore.getState().start();
      usePomodoroStore.getState().pause();

      expect(usePomodoroStore.getState().isPaused).toBe(true);

      usePomodoroStore.getState().resume();

      expect(usePomodoroStore.getState().isPaused).toBe(false);
    });

    it('should restart the interval when resumed', () => {
      usePomodoroStore.getState().start();
      usePomodoroStore.getState().pause();
      expect(usePomodoroStore.getState()._intervalId).toBeNull();

      usePomodoroStore.getState().resume();
      expect(usePomodoroStore.getState()._intervalId).not.toBeNull();
    });

    it('should do nothing when not active', () => {
      usePomodoroStore.setState({ isActive: false, isPaused: true });

      usePomodoroStore.getState().resume();

      expect(usePomodoroStore.getState().isPaused).toBe(true);
    });

    it('should do nothing when not paused', () => {
      usePomodoroStore.getState().start();

      usePomodoroStore.getState().resume();

      expect(usePomodoroStore.getState().isPaused).toBe(false);
    });
  });

  describe('_tick', () => {
    it('should decrement remaining by 1 second', () => {
      usePomodoroStore.setState({
        isActive: true,
        isPaused: false,
        remaining: 100,
      });

      usePomodoroStore.getState()._tick();

      expect(usePomodoroStore.getState().remaining).toBe(99);
    });

    it('should do nothing when paused', () => {
      usePomodoroStore.setState({
        isActive: true,
        isPaused: true,
        remaining: 100,
      });

      usePomodoroStore.getState()._tick();

      expect(usePomodoroStore.getState().remaining).toBe(100);
    });

    it('should do nothing when not active', () => {
      usePomodoroStore.setState({
        isActive: false,
        isPaused: false,
        remaining: 100,
      });

      usePomodoroStore.getState()._tick();

      expect(usePomodoroStore.getState().remaining).toBe(100);
    });
  });

  describe('stop', () => {
    it('should reset all state', async () => {
      usePomodoroStore.getState().start('note-123', 'Test Note', 'session-456', 15);
      usePomodoroStore.setState({ remaining: 300 });

      await usePomodoroStore.getState().stop();

      const state = usePomodoroStore.getState();
      expect(state.isActive).toBe(false);
      expect(state.noteId).toBeNull();
      expect(state.noteTitle).toBeNull();
      expect(state.sessionId).toBeNull();
      expect(state.startedAt).toBeNull();
      expect(state.duration).toBe(DEFAULT_DURATION);
      expect(state.remaining).toBe(DEFAULT_DURATION);
      expect(state.isPaused).toBe(false);
      expect(state._intervalId).toBeNull();
    });

    it('should preserve settings after stop', async () => {
      usePomodoroStore.getState().updateSettings({ durationMinutes: 30 });
      usePomodoroStore.getState().start();

      await usePomodoroStore.getState().stop();

      expect(usePomodoroStore.getState().settings.durationMinutes).toBe(30);
    });

    it('should call onComplete callback with sessionId', async () => {
      const onComplete = vi.fn().mockResolvedValue(undefined);
      usePomodoroStore.setState({
        isActive: true,
        sessionId: 'session-123',
      });

      await usePomodoroStore.getState().stop(onComplete);

      expect(onComplete).toHaveBeenCalledWith('session-123', false);
    });
  });

  describe('toggleExpanded', () => {
    it('should toggle isExpanded state', () => {
      expect(usePomodoroStore.getState().isExpanded).toBe(true);

      usePomodoroStore.getState().toggleExpanded();
      expect(usePomodoroStore.getState().isExpanded).toBe(false);

      usePomodoroStore.getState().toggleExpanded();
      expect(usePomodoroStore.getState().isExpanded).toBe(true);
    });
  });

  describe('updateSettings', () => {
    it('should update specific settings', () => {
      usePomodoroStore.getState().updateSettings({ durationMinutes: 30 });

      const settings = usePomodoroStore.getState().settings;
      expect(settings.durationMinutes).toBe(30);
      expect(settings.soundEnabled).toBe(true); // Unchanged
    });

    it('should merge with existing settings', () => {
      usePomodoroStore.getState().updateSettings({ soundEnabled: false });
      usePomodoroStore.getState().updateSettings({ vibrationEnabled: false });

      const settings = usePomodoroStore.getState().settings;
      expect(settings.soundEnabled).toBe(false);
      expect(settings.vibrationEnabled).toBe(false);
      expect(settings.durationMinutes).toBe(25); // Unchanged
    });
  });
});

describe('formatTime', () => {
  it('should format seconds to MM:SS', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(60)).toBe('01:00');
    expect(formatTime(90)).toBe('01:30');
    expect(formatTime(1500)).toBe('25:00');
    expect(formatTime(3599)).toBe('59:59');
  });

  it('should pad single digits with zero', () => {
    expect(formatTime(5)).toBe('00:05');
    expect(formatTime(65)).toBe('01:05');
  });
});

describe('calculateProgress', () => {
  it('should calculate progress as 0-1 range', () => {
    expect(calculateProgress(1500, 1500)).toBe(0);
    expect(calculateProgress(750, 1500)).toBe(0.5);
    expect(calculateProgress(0, 1500)).toBe(1);
  });

  it('should handle edge cases', () => {
    expect(calculateProgress(100, 0)).toBe(0);
    expect(calculateProgress(0, 0)).toBe(0);
  });
});
