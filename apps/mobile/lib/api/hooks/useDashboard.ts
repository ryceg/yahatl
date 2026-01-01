/**
 * Dashboard API Hooks
 *
 * TanStack Query hooks for dashboard data.
 */
import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary, DashboardSummary, UpcomingItem, WaitingItem, StreakItem } from '../api';
import { queryKeys } from '../queryClient';

export type { DashboardSummary };

/**
 * Hook for fetching dashboard summary.
 */
export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboard.summary(),
    queryFn: async () => getDashboardSummary(),
  });
}

/**
 * Combined dashboard hook for app screen.
 * Returns all dashboard-related queries.
 */
export function useDashboard() {
  const summary = useQuery({
    queryKey: queryKeys.dashboard.summary(),
    queryFn: async () => getDashboardSummary(),
  });

  // Stub queries for upcoming, waiting, and streaks
  // These will be populated when the HA API adds these endpoints
  const upcoming = useQuery({
    queryKey: ['dashboard', 'upcoming'],
    queryFn: async (): Promise<UpcomingItem[]> => [],
  });

  const waiting = useQuery({
    queryKey: ['dashboard', 'waiting'],
    queryFn: async (): Promise<WaitingItem[]> => [],
  });

  const streaks = useQuery({
    queryKey: ['dashboard', 'streaks'],
    queryFn: async (): Promise<StreakItem[]> => [],
  });

  return {
    summary,
    upcoming,
    waiting,
    streaks,
    isLoading: summary.isLoading,
    isError: summary.isError,
    refetchAll: () => {
      summary.refetch();
      upcoming.refetch();
      waiting.refetch();
      streaks.refetch();
    },
  };
}
