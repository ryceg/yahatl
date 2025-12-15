/**
 * Notes API Hooks
 *
 * TanStack Query hooks for note operations.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  NotesClient,
  CreateNoteRequest,
  UpdateNoteRequest,
  QuickCaptureRequest,
  TemplateType,
  NoteResponse,
  API_BASE_URL,
} from '../client';
import { queryKeys } from '../queryClient';

/**
 * Get a configured NotesClient instance.
 * Auth headers are automatically handled by the base class.
 */
function getNotesClient() {
  return new NotesClient(API_BASE_URL);
}

/**
 * Filter parameters for fetching notes.
 */
export interface NotesFilters {
  templateType?: TemplateType | null;
  tag?: string | null;
  needsDetail?: boolean | null;
  isInbox?: boolean | null;
  assigneeId?: string | null;
  search?: string | null;
  limit?: number;
  offset?: number;
}

/**
 * Hook for fetching a paginated list of notes.
 */
export function useNotes(filters: NotesFilters = {}) {
  return useQuery({
    queryKey: queryKeys.notes.list(filters),
    queryFn: async ({ signal }) => {
      const client = getNotesClient();
      return client.getNotes(
        filters.templateType,
        filters.tag,
        filters.needsDetail,
        filters.isInbox,
        filters.assigneeId,
        filters.search,
        filters.limit ?? 50,
        filters.offset ?? 0,
        signal
      );
    },
  });
}

/**
 * Hook for fetching a single note by ID.
 */
export function useNote(id: string) {
  return useQuery({
    queryKey: queryKeys.notes.detail(id),
    queryFn: async ({ signal }) => {
      const client = getNotesClient();
      return client.getNote(id, signal);
    },
    enabled: !!id,
  });
}

/**
 * Hook for creating a new note.
 */
export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateNoteRequest) => {
      const client = getNotesClient();
      return client.createNote(request);
    },
    onSuccess: () => {
      // Invalidate notes list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists() });
    },
  });
}

/**
 * Hook for quick capture (simplified note creation for inbox).
 */
export function useQuickCapture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: QuickCaptureRequest) => {
      const client = getNotesClient();
      return client.quickCapture(request);
    },
    onSuccess: () => {
      // Invalidate notes list and dashboard
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary() });
    },
  });
}

/**
 * Hook for updating a note.
 */
export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, request }: { id: string; request: UpdateNoteRequest }) => {
      const client = getNotesClient();
      return client.updateNote(id, request);
    },
    onSuccess: (data: NoteResponse) => {
      // Update the specific note in cache
      if (data.id) {
        queryClient.setQueryData(queryKeys.notes.detail(data.id), data);
      }
      // Invalidate list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists() });
    },
  });
}

/**
 * Hook for deleting a note.
 */
export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const client = getNotesClient();
      return client.deleteNote(id);
    },
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.notes.detail(id) });
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists() });
    },
  });
}

/**
 * Hook for moving a note to inbox.
 */
export function useMoveToInbox() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const client = getNotesClient();
      return client.moveToInbox(id);
    },
    onSuccess: (data: NoteResponse) => {
      if (data.id) {
        queryClient.setQueryData(queryKeys.notes.detail(data.id), data);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary() });
    },
  });
}

/**
 * Hook for moving a note out of inbox.
 */
export function useMoveFromInbox() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const client = getNotesClient();
      return client.moveFromInbox(id);
    },
    onSuccess: (data: NoteResponse) => {
      if (data.id) {
        queryClient.setQueryData(queryKeys.notes.detail(data.id), data);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary() });
    },
  });
}
