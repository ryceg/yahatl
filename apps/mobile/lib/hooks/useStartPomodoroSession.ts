/**
 * useStartPomodoroSession Hook
 *
 * Combines the local Pomodoro store state with the backend API.
 * Starts a session on the backend and syncs to local state.
 */
import { useCallback } from 'react';
import { usePomodoroStore } from '@/lib/stores/pomodoroStore';
import { useStartPomodoro } from '@/lib/api/hooks';
import { useNote } from '@/lib/api/hooks';

interface StartPomodoroOptions {
  noteId?: string;
  durationMinutes?: number;
}

/**
 * Hook that provides a function to start a Pomodoro session.
 * Handles both backend API call and local state update.
 */
export function useStartPomodoroSession() {
  const startLocalPomodoro = usePomodoroStore((s) => s.start);
  const isActive = usePomodoroStore((s) => s.isActive);
  const startPomodoro = useStartPomodoro();

  const startSession = useCallback(
    async (options: StartPomodoroOptions = {}) => {
      const { noteId, durationMinutes = 25 } = options;

      try {
        // Start session on backend
        const session = await startPomodoro.mutateAsync({
          noteId,
          durationMinutes,
        });

        // Start local timer with session info
        startLocalPomodoro(
          session.noteId ?? undefined,
          session.noteTitle ?? undefined,
          session.id,
          session.durationMinutes
        );

        return session;
      } catch (error) {
        console.error('Failed to start pomodoro session:', error);
        throw error;
      }
    },
    [startPomodoro, startLocalPomodoro]
  );

  return {
    startSession,
    isStarting: startPomodoro.isPending,
    isActive,
    error: startPomodoro.error,
  };
}

