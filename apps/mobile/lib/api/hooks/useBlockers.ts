/**
 * Blockers API Hooks
 *
 * TanStack Query hooks for blocker operations.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BlockersClient,
  API_BASE_URL,
  CreateNoteBlockerRequest,
  CreatePersonBlockerRequest,
  CreateTimeBlockerRequest,
  CreateConditionBlockerRequest,
  CreateUntilDateBlockerRequest,
  CreateFreetextBlockerRequest,
} from '../client';
import { queryKeys } from '../queryClient';

/**
 * Get a configured BlockersClient instance.
 * Auth headers are automatically handled by the base class.
 */
function getBlockersClient() {
  return new BlockersClient(API_BASE_URL);
}

/**
 * Hook for fetching blockers for a note.
 */
export function useBlockers(noteId: string) {
  return useQuery({
    queryKey: queryKeys.blockers.byNote(noteId),
    queryFn: async ({ signal }) => {
      const client = getBlockersClient();
      return client.getBlockers(noteId, signal);
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
      const client = getBlockersClient();
      return client.resolveBlocker(noteId, blockerId);
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blockers.byNote(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.waiting() });
    },
  });
}

/**
 * Hook for adding a note blocker (blocked by another note's completion).
 */
export function useAddNoteBlocker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, request }: { noteId: string; request: CreateNoteBlockerRequest }) => {
      const client = getBlockersClient();
      return client.addNoteBlocker(noteId, request);
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blockers.byNote(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.waiting() });
    },
  });
}

/**
 * Hook for adding a person blocker (waiting on a person).
 */
export function useAddPersonBlocker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, request }: { noteId: string; request: CreatePersonBlockerRequest }) => {
      const client = getBlockersClient();
      return client.addPersonBlocker(noteId, request);
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blockers.byNote(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.waiting() });
    },
  });
}

/**
 * Hook for adding a time blocker (blocked during time windows).
 */
export function useAddTimeBlocker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, request }: { noteId: string; request: CreateTimeBlockerRequest }) => {
      const client = getBlockersClient();
      return client.addTimeBlocker(noteId, request);
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blockers.byNote(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
    },
  });
}

/**
 * Hook for adding a condition blocker (MQTT-based).
 */
export function useAddConditionBlocker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, request }: { noteId: string; request: CreateConditionBlockerRequest }) => {
      const client = getBlockersClient();
      return client.addConditionBlocker(noteId, request);
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blockers.byNote(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
    },
  });
}

/**
 * Hook for adding an until-date blocker (deferred until date).
 */
export function useAddUntilDateBlocker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, request }: { noteId: string; request: CreateUntilDateBlockerRequest }) => {
      const client = getBlockersClient();
      return client.addUntilDateBlocker(noteId, request);
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blockers.byNote(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
    },
  });
}

/**
 * Hook for adding a freetext blocker (manual description).
 */
export function useAddFreetextBlocker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, request }: { noteId: string; request: CreateFreetextBlockerRequest }) => {
      const client = getBlockersClient();
      return client.addFreetextBlocker(noteId, request);
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blockers.byNote(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.waiting() });
    },
  });
}

