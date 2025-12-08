/**
 * API Client for YAHATL Backend
 *
 * TODO: NSwag client generation is currently blocked (dotnet build not working).
 *
 * Implementation details for when NSwag is available:
 * 1. Copy generated client from src/Yahatl.Api.Client/generated/ to this directory
 * 2. The NSwag configuration generates TypeScript clients with Fetch API
 * 3. Configure the client with base URL and auth token
 * 4. Create typed wrapper functions for API endpoints
 *
 * Expected generated files:
 * - generated/api-client.ts - Main client class with all endpoints
 * - generated/models.ts - TypeScript interfaces for all DTOs
 *
 * Expected clients to be generated:
 * - NotesClient - CRUD operations for notes
 * - AuthClient - Login, register, refresh token
 * - PlannerClient - Today's plan, candidates
 * - PomodoroClient - Timer sessions
 * - CaptureClient - Quick note creation
 * - BlockersClient - Blocker management
 * - TriggersClient - Trigger management
 *
 * Usage example (once generated):
 * ```typescript
 * import { NotesClient, Configuration } from './generated/api-client';
 *
 * const config = new Configuration({
 *   basePath: API_BASE_URL,
 *   accessToken: () => authStore.getState().token ?? '',
 * });
 *
 * const notesClient = new NotesClient(config);
 * const notes = await notesClient.getAll();
 * ```
 */

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000';

// Placeholder exports to prevent import errors
export const apiConfig = {
  baseUrl: API_BASE_URL,
  // TODO: Add proper headers and auth when NSwag client is available
};

/**
 * Placeholder fetch wrapper
 * TODO: Replace with generated NSwag client
 */
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // TODO: Add Authorization header from auth store
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
