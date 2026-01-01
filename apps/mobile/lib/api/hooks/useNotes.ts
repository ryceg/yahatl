/**
 * Notes API Hooks
 *
 * TanStack Query hooks for note operations.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  captureNote,
  NotesParams,
  CreateNoteRequest,
  UpdateNoteRequest,
  NoteResponse,
  TemplateType,
} from '../api';
import { queryKeys } from '../queryClient';

export type { TemplateType };

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
    queryFn: async () => {
      const params: NotesParams = {
        templateType: filters.templateType,
        tag: filters.tag,
        needsDetail: filters.needsDetail,
        isInbox: filters.isInbox,
        assigneeId: filters.assigneeId,
        search: filters.search,
        limit: filters.limit ?? 50,
        offset: filters.offset ?? 0,
      };
      return getNotes(params);
    },
  });
}

/**
 * Hook for fetching a single note by ID.
 */
export function useNote(id: string) {
  return useQuery({
    queryKey: queryKeys.notes.detail(id),
    queryFn: async () => getNote(id),
    enabled: !!id,
  });
}

/**
 * Hook for creating a new note.
 */
export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateNoteRequest) => createNote(request),
    onSuccess: () => {
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
    mutationFn: async ({ title, tags }: { title: string; tags?: string[] }) => {
      return captureNote(title, tags);
    },
    onSuccess: () => {
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
      return updateNote(id, request);
    },
    onSuccess: (data: NoteResponse) => {
      if (data.id) {
        queryClient.setQueryData(queryKeys.notes.detail(data.id), data);
      }
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
    mutationFn: async (id: string) => deleteNote(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.notes.detail(id) });
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
    mutationFn: async (id: string) => updateNote(id, { isInbox: true }),
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
    mutationFn: async (id: string) => updateNote(id, { isInbox: false }),
    onSuccess: (data: NoteResponse) => {
      if (data.id) {
        queryClient.setQueryData(queryKeys.notes.detail(data.id), data);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary() });
    },
  });
}
