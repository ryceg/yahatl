/**
 * Search API Hooks
 *
 * TanStack Query hooks for search operations.
 */
import { useQuery } from '@tanstack/react-query';
import { SearchClient, API_BASE_URL, TemplateType } from '../client';

/**
 * Get a configured SearchClient instance.
 * Auth headers are automatically handled by the base class.
 */
function getSearchClient() {
  return new SearchClient(API_BASE_URL);
}

/**
 * Hook for searching notes with optional filters.
 */
export function useSearch(
  query: string,
  options?: {
    templateType?: TemplateType;
    limit?: number;
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: ['search', query, options?.templateType, options?.limit],
    queryFn: async ({ signal }) => {
      const client = getSearchClient();
      return client.search(
        query,
        options?.templateType,
        options?.limit ?? 20,
        0,
        signal
      );
    },
    enabled: options?.enabled !== false && query.length >= 1,
    staleTime: 10_000, // Search results valid for 10 seconds
  });
}

/**
 * Hook for searching Person notes specifically.
 */
export function useSearchPeople(query: string, options?: { enabled?: boolean }) {
  return useSearch(query, {
    templateType: TemplateType.Person,
    limit: 10,
    enabled: options?.enabled,
  });
}

/**
 * Hook for searching notes that can be blockers.
 */
export function useSearchBlockerNotes(query: string, options?: { enabled?: boolean }) {
  return useSearch(query, {
    limit: 10,
    enabled: options?.enabled,
  });
}

