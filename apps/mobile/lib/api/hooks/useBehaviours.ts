/**
 * Behaviours API Hooks
 *
 * TanStack Query hooks for behaviour operations.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BehavioursClient,
  API_BASE_URL,
  CreateTaskBehaviourRequest,
  CreateHabitBehaviourRequest,
  CreateChoreBehaviourRequest,
  CreateReminderBehaviourRequest,
} from '../client';
import { queryKeys } from '../queryClient';

/**
 * Get a configured BehavioursClient instance.
 * Auth headers are automatically handled by the base class.
 */
function getBehavioursClient() {
  return new BehavioursClient(API_BASE_URL);
}

/**
 * Hook for fetching behaviours for a note.
 */
export function useBehaviours(noteId: string) {
  return useQuery({
    queryKey: queryKeys.behaviours.byNote(noteId),
    queryFn: async ({ signal }) => {
      const client = getBehavioursClient();
      return client.getBehaviours(noteId, signal);
    },
    enabled: !!noteId,
  });
}

/**
 * Hook for completing a task.
 */
export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: string) => {
      const client = getBehavioursClient();
      return client.completeTask(noteId);
    },
    onSuccess: (_, noteId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.behaviours.byNote(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.planner.today() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary() });
    },
  });
}

/**
 * Hook for reopening a task.
 */
export function useReopenTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: string) => {
      const client = getBehavioursClient();
      return client.reopenTask(noteId);
    },
    onSuccess: (_, noteId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.behaviours.byNote(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.planner.today() });
    },
  });
}

/**
 * Hook for completing a habit.
 */
export function useCompleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: string) => {
      const client = getBehavioursClient();
      return client.completeHabit(noteId);
    },
    onSuccess: (_, noteId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.behaviours.byNote(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.streaks() });
    },
  });
}

/**
 * Hook for completing a chore.
 */
export function useCompleteChore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: string) => {
      const client = getBehavioursClient();
      return client.completeChore(noteId);
    },
    onSuccess: (_, noteId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.behaviours.byNote(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
    },
  });
}

/**
 * Hook for adding a task behaviour to a note.
 */
export function useAddTaskBehaviour() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, request }: { noteId: string; request: CreateTaskBehaviourRequest }) => {
      const client = getBehavioursClient();
      return client.addTaskBehaviour(noteId, request);
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.behaviours.byNote(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists() });
    },
  });
}

/**
 * Hook for adding a habit behaviour to a note.
 */
export function useAddHabitBehaviour() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, request }: { noteId: string; request: CreateHabitBehaviourRequest }) => {
      const client = getBehavioursClient();
      return client.addHabitBehaviour(noteId, request);
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.behaviours.byNote(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.streaks() });
    },
  });
}

/**
 * Hook for adding a chore behaviour to a note.
 */
export function useAddChoreBehaviour() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, request }: { noteId: string; request: CreateChoreBehaviourRequest }) => {
      const client = getBehavioursClient();
      return client.addChoreBehaviour(noteId, request);
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.behaviours.byNote(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
    },
  });
}

/**
 * Hook for adding a reminder behaviour to a note.
 */
export function useAddReminderBehaviour() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, request }: { noteId: string; request: CreateReminderBehaviourRequest }) => {
      const client = getBehavioursClient();
      return client.addReminderBehaviour(noteId, request);
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.behaviours.byNote(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
    },
  });
}
