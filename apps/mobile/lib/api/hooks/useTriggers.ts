/**
 * Triggers API Hooks
 *
 * TanStack Query hooks for trigger operations.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TriggersClient,
  API_BASE_URL,
  CreateFixedTriggerRequest,
  CreateIntervalTriggerRequest,
  CreateWindowTriggerRequest,
  CreateConditionTriggerRequest,
} from '../client';
import { queryKeys } from '../queryClient';

/**
 * Get a configured TriggersClient instance.
 * Auth headers are automatically handled by the base class.
 */
function getTriggersClient() {
  return new TriggersClient(API_BASE_URL);
}

/**
 * Hook for fetching triggers for a note.
 */
export function useTriggers(noteId: string) {
  return useQuery({
    queryKey: queryKeys.triggers.byNote(noteId),
    queryFn: async ({ signal }) => {
      const client = getTriggersClient();
      return client.getTriggers(noteId, signal);
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
      const client = getTriggersClient();
      return client.deleteTrigger(noteId, triggerId);
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.triggers.byNote(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
    },
  });
}

/**
 * Hook for adding a fixed trigger (cron-based).
 */
export function useAddFixedTrigger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, request }: { noteId: string; request: CreateFixedTriggerRequest }) => {
      const client = getTriggersClient();
      return client.addFixedTrigger(noteId, request);
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
      const client = getTriggersClient();
      return client.addIntervalTrigger(noteId, request);
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
      const client = getTriggersClient();
      return client.addWindowTrigger(noteId, request);
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.triggers.byNote(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
    },
  });
}

/**
 * Hook for adding a condition trigger (MQTT-based).
 */
export function useAddConditionTrigger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, request }: { noteId: string; request: CreateConditionTriggerRequest }) => {
      const client = getTriggersClient();
      return client.addConditionTrigger(noteId, request);
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.triggers.byNote(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
    },
  });
}

