/**
 * Pomodoro API Hooks
 *
 * TanStack Query hooks for Pomodoro timer.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  startPomodoro,
  stopPomodoro,
  getCurrentPomodoro,
  PomodoroResponse,
} from '../api';
import { queryKeys } from '../queryClient';

export type { PomodoroResponse };

/**
 * Hook for getting current Pomodoro session.
 */
export function useCurrentPomodoro() {
  return useQuery({
    queryKey: queryKeys.pomodoro.current(),
    queryFn: async () => getCurrentPomodoro(),
    refetchInterval: 1000, // Poll every second when active
  });
}

/**
 * Hook for starting a Pomodoro session.
 */
export function useStartPomodoro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      noteId,
      durationMinutes,
    }: {
      noteId?: string;
      durationMinutes?: number;
    }) => {
      return startPomodoro(noteId, durationMinutes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pomodoro.current() });
    },
  });
}

/**
 * Hook for stopping a Pomodoro session.
 */
export function useStopPomodoro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => stopPomodoro(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pomodoro.current() });
    },
  });
}
