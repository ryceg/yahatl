/**
 * TanStack Query Client Configuration
 *
 * Central configuration for React Query.
 */
import { QueryClient } from '@tanstack/react-query';

/**
 * QueryClient singleton with default configuration.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on auth errors
        if (error instanceof Error && error.message.includes('401')) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

/**
 * Query key factory for consistent cache key generation.
 */
export const queryKeys = {
  // Auth
  auth: ['auth'] as const,

  // Notes
  notes: {
    all: ['notes'] as const,
    lists: () => [...queryKeys.notes.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.notes.lists(), filters] as const,
    details: () => [...queryKeys.notes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.notes.details(), id] as const,
  },

  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    summary: () => [...queryKeys.dashboard.all, 'summary'] as const,
    upcoming: () => [...queryKeys.dashboard.all, 'upcoming'] as const,
    waiting: () => [...queryKeys.dashboard.all, 'waiting'] as const,
    streaks: () => [...queryKeys.dashboard.all, 'streaks'] as const,
  },

  // Planner
  planner: {
    all: ['planner'] as const,
    today: () => [...queryKeys.planner.all, 'today'] as const,
    candidates: () => [...queryKeys.planner.all, 'candidates'] as const,
  },

  // Behaviours
  behaviours: {
    all: ['behaviours'] as const,
    byNote: (noteId: string) => [...queryKeys.behaviours.all, noteId] as const,
  },

  // Blockers
  blockers: {
    all: ['blockers'] as const,
    byNote: (noteId: string) => [...queryKeys.blockers.all, noteId] as const,
  },

  // Triggers
  triggers: {
    all: ['triggers'] as const,
    byNote: (noteId: string) => [...queryKeys.triggers.all, noteId] as const,
  },

  // Pomodoro
  pomodoro: {
    all: ['pomodoro'] as const,
    active: () => [...queryKeys.pomodoro.all, 'active'] as const,
    history: (noteId?: string) =>
      noteId
        ? [...queryKeys.pomodoro.all, 'history', noteId]
        : [...queryKeys.pomodoro.all, 'history'] as const,
    stats: () => [...queryKeys.pomodoro.all, 'stats'] as const,
  },
} as const;

