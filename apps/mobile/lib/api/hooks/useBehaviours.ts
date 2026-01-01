/**
 * Behaviours API Hooks
 *
 * TanStack Query hooks for task, habit, and chore behaviours.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  addTaskBehaviour,
  completeTask,
  addHabitBehaviour,
  logHabit,
  addChoreBehaviour,
  completeChore,
  Priority,
} from '../api';
import { queryKeys } from '../queryClient';

export type { Priority };

/**
 * Hook for adding a task behaviour to a note.
 */
export function useAddTaskBehaviour() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      noteId,
      dueDate,
      priority,
    }: {
      noteId: string;
      dueDate?: string;
      priority?: Priority;
    }) => {
      return addTaskBehaviour(noteId, dueDate, priority);
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists() });
    },
  });
}

/**
 * Hook for completing a task.
 */
export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: string) => completeTask(noteId),
    onSuccess: (_, noteId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary() });
      queryClient.invalidateQueries({ queryKey: queryKeys.planner.all() });
    },
  });
}

/**
 * Hook for adding a habit behaviour to a note.
 */
export function useAddHabitBehaviour() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      noteId,
      frequencyGoal,
    }: {
      noteId: string;
      frequencyGoal?: string;
    }) => {
      return addHabitBehaviour(noteId, frequencyGoal);
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists() });
    },
  });
}

/**
 * Hook for logging a habit completion.
 */
export function useLogHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: string) => logHabit(noteId),
    onSuccess: (_, noteId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary() });
    },
  });
}

/**
 * Hook for adding a chore behaviour to a note.
 */
export function useAddChoreBehaviour() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      noteId,
      intervalDays,
    }: {
      noteId: string;
      intervalDays?: number;
    }) => {
      return addChoreBehaviour(noteId, intervalDays);
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists() });
    },
  });
}

/**
 * Hook for completing a chore.
 */
export function useCompleteChore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: string) => completeChore(noteId),
    onSuccess: (_, noteId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary() });
    },
  });
}
