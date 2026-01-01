/**
 * Blockers API Hooks
 *
 * TanStack Query hooks for blocker operations.
 * Note: Blocker endpoints not yet fully implemented in HA integration.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryClient';

// Blocker types (for UI compatibility)
export interface BlockerResponse {
  id: string;
  noteId: string;
  blockerType: string;
  isActive: boolean;
  description?: string;
  untilDate?: string;
  targetNoteId?: string;
}

export interface CreateNoteBlockerRequest {
  targetNoteId: string;
}

export interface CreatePersonBlockerRequest {
  personNoteId: string;
  reason?: string;
}

export interface CreateTimeBlockerRequest {
  windows: Array<{ days: string[]; timeRange: string }>;
}

export interface CreateConditionBlockerRequest {
  topic: string;
  operator: string;
  value: unknown;
}

export interface CreateUntilDateBlockerRequest {
  until: string;
}

export interface CreateFreetextBlockerRequest {
  description: string;
}

/**
 * Hook for fetching blockers for a note.
 * Returns empty array - not yet implemented in HA API.
 */
export function useBlockers(noteId: string) {
  return useQuery({
    queryKey: queryKeys.blockers.byNote(noteId),
    queryFn: async (): Promise<BlockerResponse[]> => {
      // Stub - blockers API not yet implemented
      return [];
    },
    enabled: !!noteId,
  });
}

/**
 * Hook for resolving a blocker.
 */
export function useResolveBlocker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, blockerId }: { noteId: string; blockerId: string }) => {
      // Stub
      return { noteId, blockerId, resolved: true };
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blockers.byNote(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
    },
  });
}

/**
 * Hook for adding a note blocker.
 */
export function useAddNoteBlocker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, request }: { noteId: string; request: CreateNoteBlockerRequest }) => {
      return { id: 'stub', noteId, blockerType: 'Note', isActive: true, ...request };
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blockers.byNote(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
    },
  });
}

/**
 * Hook for adding a person blocker.
 */
export function useAddPersonBlocker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, request }: { noteId: string; request: CreatePersonBlockerRequest }) => {
      return { id: 'stub', noteId, blockerType: 'Person', isActive: true, ...request };
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blockers.byNote(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
    },
  });
}

/**
 * Hook for adding a time blocker.
 */
export function useAddTimeBlocker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, request }: { noteId: string; request: CreateTimeBlockerRequest }) => {
      return { id: 'stub', noteId, blockerType: 'Time', isActive: true, ...request };
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blockers.byNote(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
    },
  });
}

/**
 * Hook for adding a condition blocker.
 */
export function useAddConditionBlocker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, request }: { noteId: string; request: CreateConditionBlockerRequest }) => {
      return { id: 'stub', noteId, blockerType: 'Condition', isActive: true, ...request };
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blockers.byNote(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
    },
  });
}

/**
 * Hook for adding an until-date blocker.
 */
export function useAddUntilDateBlocker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, request }: { noteId: string; request: CreateUntilDateBlockerRequest }) => {
      return { id: 'stub', noteId, blockerType: 'UntilDate', isActive: true, ...request };
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blockers.byNote(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
    },
  });
}

/**
 * Hook for adding a freetext blocker.
 */
export function useAddFreetextBlocker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, request }: { noteId: string; request: CreateFreetextBlockerRequest }) => {
      return { id: 'stub', noteId, blockerType: 'Freetext', isActive: true, ...request };
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blockers.byNote(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
    },
  });
}
