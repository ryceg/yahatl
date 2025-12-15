/**
 * Pomodoro API Hooks
 *
 * TanStack Query hooks for Pomodoro timer operations.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PomodoroClient,
  StartPomodoroRequest,
  PomodoroSessionResponse,
  PomodoroHistoryItemResponse,
  PomodoroStatsResponse,
  API_BASE_URL,
} from '../client';
import { queryKeys } from '../queryClient';

/**
 * Get a configured PomodoroClient instance.
 * Auth headers are automatically handled by the base class.
 */
function getPomodoroClient() {
  return new PomodoroClient(API_BASE_URL);
}

/**
 * Hook for fetching the current active Pomodoro session.
 */
export function useCurrentPomodoro() {
  return useQuery({
    queryKey: queryKeys.pomodoro.active(),
    queryFn: async ({ signal }) => {
      const client = getPomodoroClient();
      try {
        return await client.getCurrentSession(signal);
      } catch (error: any) {
        // 404 means no active session, which is valid
        if (error?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    refetchInterval: 30_000, // Refetch every 30 seconds to keep in sync
  });
}

/**
 * Hook for starting a new Pomodoro session.
 */
export function useStartPomodoro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: StartPomodoroRequest) => {
      const client = getPomodoroClient();
      return client.startSession(request);
    },
    onSuccess: (data: PomodoroSessionResponse) => {
      // Update the active session cache
      queryClient.setQueryData(queryKeys.pomodoro.active(), data);
    },
  });
}

/**
 * Hook for stopping the current Pomodoro session.
 */
export function useStopPomodoro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ complete = true }: { complete?: boolean } = {}) => {
      const client = getPomodoroClient();
      return client.stopSession(complete);
    },
    onSuccess: () => {
      // Clear the active session cache
      queryClient.setQueryData(queryKeys.pomodoro.active(), null);
      // Invalidate history to include the new completed session
      queryClient.invalidateQueries({ queryKey: queryKeys.pomodoro.history() });
    },
  });
}

/**
 * Hook for fetching Pomodoro session history.
 */
export function usePomodoroHistory(noteId?: string, limit = 50, offset = 0) {
  return useQuery({
    queryKey: queryKeys.pomodoro.history(noteId),
    queryFn: async ({ signal }) => {
      const client = getPomodoroClient();
      return client.getHistory(limit, offset, noteId, signal);
    },
  });
}

/**
 * Hook for fetching Pomodoro stats for a specific note.
 */
export function usePomodoroStats(noteId: string) {
  return useQuery({
    queryKey: [...queryKeys.pomodoro.stats(), noteId],
    queryFn: async ({ signal }) => {
      const client = getPomodoroClient();
      return client.getNoteStats(noteId, signal);
    },
    enabled: !!noteId,
  });
}

