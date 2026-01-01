/**
 * Capture Hooks
 *
 * TanStack Query hooks for quick capture functionality.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { captureNote, getNotes, NoteResponse, API_BASE_URL } from '../api/api';
import { queryKeys } from '../api/queryClient';

export { API_BASE_URL };

/**
 * Quick capture mutation - creates a note in inbox state.
 * Triggers haptic feedback and invalidates relevant queries on success.
 */
export function useQuickCapture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, tags }: { title: string; tags?: string[] }) => {
      return captureNote(title, tags);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary() });
      queryClient.invalidateQueries({ queryKey: ['recentCaptures'] });
      queryClient.invalidateQueries({ queryKey: ['tags', 'recent'] });
    },
  });
}

/**
 * Query for recent captures (last 5 inbox items).
 * Used to display recently captured notes on the capture screen.
 */
export function useRecentCaptures(limit: number = 5) {
  return useQuery({
    queryKey: ['recentCaptures', limit],
    queryFn: async () => {
      const response = await getNotes({ isInbox: true, limit });
      return response.items ?? [];
    },
    select: (data): Array<{
      id: string;
      title: string;
      createdAt: Date;
      tags: string[];
    }> =>
      data.map((note: NoteResponse) => ({
        id: note.id ?? '',
        title: note.title ?? '',
        createdAt: note.createdAt ? new Date(note.createdAt) : new Date(),
        tags: note.tags ?? [],
      })),
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Query for recent/popular tags.
 * Derives tag suggestions from recently updated notes.
 */
export function useRecentTags(limit: number = 10) {
  return useQuery({
    queryKey: ['tags', 'recent', limit],
    queryFn: async () => {
      const response = await getNotes({ limit: 50 });
      return response.items ?? [];
    },
    select: (data: NoteResponse[]) => {
      // Count tag occurrences
      const tagCounts = new Map<string, number>();
      data.forEach((note) => {
        note.tags?.forEach((tag) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });

      // Sort by frequency and return top tags
      return Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([tag]) => tag);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
