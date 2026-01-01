/**
 * Triggers API Hooks
 *
 * TanStack Query hooks for trigger operations.
 * Note: Trigger endpoints not yet implemented in HA integration.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryClient';

// Trigger types (for UI compatibility)
export interface TriggerResponse {
  id: string;
  noteId: string;
  triggerType: string;
  pattern?: string;
  intervalDays?: number;
}

export interface CreateFixedTriggerRequest {
  pattern: string;
}

export interface CreateIntervalTriggerRequest {
  intervalDays: number;
}

export interface CreateWindowTriggerRequest {
  windows: Array<{ preference: number; days: string[]; timeRange: string }>;
  recurrence: string;
}

export interface CreateConditionTriggerRequest {
  topic: string;
  operator: string;
  value: unknown;
}

/**
 * Hook for fetching triggers for a note.
 * Returns empty array - not yet implemented in HA API.
 */
export function useTriggers(noteId: string) {
  return useQuery({
    queryKey: queryKeys.triggers.byNote(noteId),
    queryFn: async (): Promise<TriggerResponse[]> => {
      // Stub - triggers API not yet implemented
      return [];
    },
    enabled: !!noteId,
  });
}

/**
 * Hook for deleting a trigger.
 */
export function useDeleteTrigger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, triggerId }: { noteId: string; triggerId: string }) => {
      return { noteId, triggerId, deleted: true };
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.triggers.byNote(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
    },
  });
}

/**
 * Hook for adding a fixed trigger.
 */
export function useAddFixedTrigger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, request }: { noteId: string; request: CreateFixedTriggerRequest }) => {
      return { id: 'stub', noteId, triggerType: 'Fixed', ...request };
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.triggers.byNote(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
    },
  });
}

/**
 * Hook for adding an interval trigger.
 */
export function useAddIntervalTrigger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, request }: { noteId: string; request: CreateIntervalTriggerRequest }) => {
      return { id: 'stub', noteId, triggerType: 'Interval', ...request };
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.triggers.byNote(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
    },
  });
}

/**
 * Hook for adding a window trigger.
 */
export function useAddWindowTrigger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, request }: { noteId: string; request: CreateWindowTriggerRequest }) => {
      return { id: 'stub', noteId, triggerType: 'Window', ...request };
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.triggers.byNote(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
    },
  });
}

/**
 * Hook for adding a condition trigger.
 */
export function useAddConditionTrigger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, request }: { noteId: string; request: CreateConditionTriggerRequest }) => {
      return { id: 'stub', noteId, triggerType: 'Condition', ...request };
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.triggers.byNote(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
    },
  });
}
