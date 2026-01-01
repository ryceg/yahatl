/**
 * Search API Hooks
 *
 * TanStack Query hooks for search operations.
 */
import { useQuery } from '@tanstack/react-query';
import { getNotes, NoteResponse } from '../api';
import { queryKeys } from '../queryClient';

/**
 * Hook for searching notes.
 */
export function useSearch(query: string) {
  return useQuery({
    queryKey: queryKeys.search.results(query),
    queryFn: async (): Promise<NoteResponse[]> => {
      if (!query.trim()) {
        return [];
      }
      const result = await getNotes({ search: query, limit: 20 });
      return result.items;
    },
    enabled: query.length > 0,
  });
}
