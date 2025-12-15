/**
 * Planner API Hooks
 *
 * TanStack Query hooks for planner operations.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlannerClient, API_BASE_URL } from '../client';
import { queryKeys } from '../queryClient';

/**
 * Get a configured PlannerClient instance.
 * Auth headers are automatically handled by the base class.
 */
function getPlannerClient() {
  return new PlannerClient(API_BASE_URL);
}

/**
 * Hook for fetching today's plan.
 */
export function useTodaysPlan() {
  return useQuery({
    queryKey: queryKeys.planner.today(),
    queryFn: async ({ signal }) => {
      const client = getPlannerClient();
      return client.getTodaysPlan(signal);
    },
  });
}

/**
 * Hook for fetching candidate items.
 */
export function useCandidates() {
  return useQuery({
    queryKey: queryKeys.planner.candidates(),
    queryFn: async ({ signal }) => {
      const client = getPlannerClient();
      return client.getCandidates(signal);
    },
  });
}

/**
 * Hook for adding an item to today's plan.
 */
export function useAddToPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: string) => {
      const client = getPlannerClient();
      return client.addToPlan(noteId);
    },
    onSuccess: () => {
      // Invalidate planner queries to refetch
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
    mutationFn: async (noteId: string) => {
      const client = getPlannerClient();
      return client.removeFromPlan(noteId);
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
    mutationFn: async (noteIds: string[]) => {
      const client = getPlannerClient();
      return client.reorderPlan(noteIds);
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
      const client = getPlannerClient();
      return client.rollover();
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
