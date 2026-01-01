/**
 * Planner API Hooks
 *
 * TanStack Query hooks for planner operations.
 * Note: Planner endpoints not yet implemented in HA integration.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotes, NoteResponse } from '../api';
import { queryKeys } from '../queryClient';

export interface PlanItem {
  id: string;
  noteId: string;
  title: string;
  order: number;
  isComplete: boolean;
}

export interface CandidatesResult {
  urgent: NoteResponse[];
  dueSoon: NoteResponse[];
  available: NoteResponse[];
}

/**
 * Hook for fetching today's plan.
 * Currently returns notes as a simple list.
 */
export function useTodaysPlan() {
  return useQuery({
    queryKey: queryKeys.planner.today(),
    queryFn: async () => {
      // For now, return tasks with due dates as the "plan"
      const result = await getNotes({ templateType: 'Task', limit: 20 });
      return result.items.map((note, idx) => ({
        id: note.id,
        noteId: note.id,
        title: note.title,
        order: idx,
        isComplete: false,
      }));
    },
  });
}

/**
 * Hook for fetching candidate items.
 * Currently returns notes grouped by template type.
 */
export function useCandidates() {
  return useQuery({
    queryKey: queryKeys.planner.candidates(),
    queryFn: async (): Promise<CandidatesResult> => {
      const result = await getNotes({ limit: 50 });
      return {
        urgent: result.items.filter(n => n.templateType === 'Task').slice(0, 5),
        dueSoon: result.items.filter(n => n.templateType === 'Chore').slice(0, 5),
        available: result.items.filter(n => n.templateType === 'Habit').slice(0, 5),
      };
    },
  });
}

/**
 * Hook for adding an item to today's plan.
 * Stub - to be implemented when planner API is added.
 */
export function useAddToPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_noteId: string) => {
      // Stub - planner API not yet implemented
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.planner.today() });
      queryClient.invalidateQueries({ queryKey: queryKeys.planner.candidates() });
    },
  });
}

/**
 * Hook for removing an item from today's plan.
 */
export function useRemoveFromPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_noteId: string) => {
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.planner.today() });
      queryClient.invalidateQueries({ queryKey: queryKeys.planner.candidates() });
    },
  });
}

/**
 * Hook for reordering items in today's plan.
 */
export function useReorderPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_noteIds: string[]) => {
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.planner.today() });
    },
  });
}

/**
 * Hook for rolling over incomplete items.
 */
export function useRollover() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return { rolledOver: 0, dropped: 0 };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.planner.today() });
      queryClient.invalidateQueries({ queryKey: queryKeys.planner.candidates() });
    },
  });
}

/**
 * Combined hook for planner data.
 */
export function usePlanner() {
  const todaysPlan = useTodaysPlan();
  const candidates = useCandidates();

  return {
    todaysPlan,
    candidates,
    isLoading: todaysPlan.isLoading || candidates.isLoading,
    isError: todaysPlan.isError || candidates.isError,
    refetchAll: () => {
      todaysPlan.refetch();
      candidates.refetch();
    },
  };
}
