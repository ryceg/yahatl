/**
 * Dashboard API Hooks
 *
 * TanStack Query hooks for dashboard data.
 */
import { useQuery } from '@tanstack/react-query';
import { DashboardClient, API_BASE_URL } from '../client';
import { queryKeys } from '../queryClient';

/**
 * Get a configured DashboardClient instance.
 * Auth headers are automatically handled by the base class.
 */
function getDashboardClient() {
  return new DashboardClient(API_BASE_URL);
}

/**
 * Hook for fetching dashboard summary stats.
 */
export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboard.summary(),
    queryFn: async ({ signal }) => {
      const client = getDashboardClient();
      return client.getSummary(signal);
    },
    // Refetch every 60 seconds for live updates
    refetchInterval: 60_000,
  });
}

/**
 * Hook for fetching upcoming items.
 */
export function useUpcoming() {
  return useQuery({
    queryKey: queryKeys.dashboard.upcoming(),
    queryFn: async ({ signal }) => {
      const client = getDashboardClient();
      return client.getUpcoming(signal);
    },
  });
}

/**
 * Hook for fetching waiting/blocked items.
 */
export function useWaiting() {
  return useQuery({
    queryKey: queryKeys.dashboard.waiting(),
    queryFn: async ({ signal }) => {
      const client = getDashboardClient();
      return client.getWaiting(signal);
    },
  });
}

/**
 * Hook for fetching streak items.
 */
export function useStreaks() {
  return useQuery({
    queryKey: queryKeys.dashboard.streaks(),
    queryFn: async ({ signal }) => {
      const client = getDashboardClient();
      return client.getStreaks(signal);
    },
  });
}

/**
 * Combined hook for all dashboard data.
 * Useful for initial page load.
 */
export function useDashboard() {
  const summary = useDashboardSummary();
  const upcoming = useUpcoming();
  const waiting = useWaiting();
  const streaks = useStreaks();

  return {
    summary,
    upcoming,
    waiting,
    streaks,
    isLoading:
      summary.isLoading ||
      upcoming.isLoading ||
      waiting.isLoading ||
      streaks.isLoading,
    isError:
      summary.isError ||
      upcoming.isError ||
      waiting.isError ||
      streaks.isError,
    refetchAll: () => {
      summary.refetch();
      upcoming.refetch();
      waiting.refetch();
      streaks.refetch();
    },
  };
}
