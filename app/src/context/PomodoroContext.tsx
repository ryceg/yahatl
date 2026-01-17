/**
 * Pomodoro timer context
 */

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { PomodoroState, PomodoroConfig } from '../types';
import { useAuth } from './AuthContext';

interface PomodoroContextType {
  state: PomodoroState;
  start: (itemId: string, itemTitle: string) => void;
  stop: () => void;
  skip: () => void;
  config: PomodoroConfig;
  updateConfig: (config: PomodoroConfig) => void;
}

const DEFAULT_STATE: PomodoroState = {
  active: false,
  is_break: false,
  session_count: 0,
  time_remaining: 0,
};

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const PomodoroProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { config: appConfig, updateConfig: updateAppConfig } = useAuth();
  const [state, setState] = useState<PomodoroState>(DEFAULT_STATE);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);

  const pomodoroConfig = appConfig?.pomodoro || {
    work_duration: 25,
    short_break: 5,
    long_break: 15,
    sessions_before_long_break: 4,
  };

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [state]);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      appStateRef.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      // App came to foreground, recalculate time if timer is running
      if (state.active && state.started_at) {
        const elapsed = Math.floor((Date.now() - new Date(state.started_at).getTime()) / 1000);
        const duration = state.is_break
          ? (state.session_count % pomodoroConfig.sessions_before_long_break === 0
              ? pomodoroConfig.long_break
              : pomodoroConfig.short_break) * 60
          : pomodoroConfig.work_duration * 60;

        const remaining = Math.max(0, duration - elapsed);

        if (remaining === 0) {
          completeSession();
        } else {
          setState(prev => ({ ...prev, time_remaining: remaining }));
        }
      }
    }

    appStateRef.current = nextAppState;
  };

  // Timer tick
  useEffect(() => {
    if (state.active && state.time_remaining > 0) {
      timerRef.current = setInterval(() => {
        setState(prev => {
          const newRemaining = prev.time_remaining - 1;

          if (newRemaining <= 0) {
            completeSession();
            return prev;
          }

          return { ...prev, time_remaining: newRemaining };
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [state.active, state.time_remaining]);

  const start = (itemId: string, itemTitle: string) => {
    const duration = pomodoroConfig.work_duration * 60; // Convert to seconds

    setState({
      active: true,
      item_id: itemId,
      item_title: itemTitle,
      is_break: false,
      session_count: 0,
      time_remaining: duration,
      started_at: new Date().toISOString(),
    });

    // Schedule notification
    Notifications.scheduleNotificationAsync({
      content: {
        title: 'Pomodoro Complete!',
        body: `Work session finished for "${itemTitle}"`,
      },
      trigger: { seconds: duration },
    });
  };

  const stop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Cancel pending notifications
    Notifications.cancelAllScheduledNotificationsAsync();

    setState(DEFAULT_STATE);
  };

  const skip = () => {
    completeSession();
  };

  const completeSession = () => {
    if (state.is_break) {
      // Break completed, back to work
      const duration = pomodoroConfig.work_duration * 60;
      setState(prev => ({
        ...prev,
        is_break: false,
        time_remaining: duration,
        started_at: new Date().toISOString(),
      }));

      Notifications.scheduleNotificationAsync({
        content: {
          title: 'Break Over!',
          body: 'Time to get back to work',
        },
        trigger: null,
      });
    } else {
      // Work session completed
      const newSessionCount = state.session_count + 1;
      const isLongBreak = newSessionCount % pomodoroConfig.sessions_before_long_break === 0;
      const breakDuration = (isLongBreak ? pomodoroConfig.long_break : pomodoroConfig.short_break) * 60;

      setState(prev => ({
        ...prev,
        is_break: true,
        session_count: newSessionCount,
        time_remaining: breakDuration,
        started_at: new Date().toISOString(),
      }));

      Notifications.scheduleNotificationAsync({
        content: {
          title: 'Work Session Complete!',
          body: `Take a ${isLongBreak ? 'long' : 'short'} break`,
        },
        trigger: null,
      });
    }
  };

  const updateConfig = async (newConfig: PomodoroConfig) => {
    if (appConfig) {
      await updateAppConfig({ pomodoro: newConfig });
    }
  };

  return (
    <PomodoroContext.Provider
      value={{
        state,
        start,
        stop,
        skip,
        config: pomodoroConfig,
        updateConfig,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
};

export const usePomodoro = () => {
  const context = useContext(PomodoroContext);
  if (context === undefined) {
    throw new Error('usePomodoro must be used within a PomodoroProvider');
  }
  return context;
};
