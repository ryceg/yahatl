/**
 * React Query hooks for yahatl API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import type { YahtlItem, YahtlList, QueueItem, ContextState, Trait } from '../types';

export const QUERY_KEYS = {
  lists: ['lists'],
  list: (id: string) => ['list', id],
  items: (listId: string) => ['items', listId],
  queue: ['queue'],
};

/**
 * Get all lists
 */
export const useLists = () => {
  const { client } = useAuth();

  return useQuery<YahtlList[]>({
    queryKey: QUERY_KEYS.lists,
    queryFn: () => client!.getLists(),
    enabled: !!client,
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Get a specific list
 */
export const useList = (entityId: string) => {
  const { client } = useAuth();

  return useQuery<YahtlList | null>({
    queryKey: QUERY_KEYS.list(entityId),
    queryFn: () => client!.getList(entityId),
    enabled: !!client && !!entityId,
    staleTime: 30000,
  });
};

/**
 * Get items from a list
 */
export const useItems = (entityId: string) => {
  const { client } = useAuth();

  return useQuery<YahtlItem[]>({
    queryKey: QUERY_KEYS.items(entityId),
    queryFn: () => client!.getItems(entityId),
    enabled: !!client && !!entityId,
    staleTime: 30000,
  });
};

/**
 * Get priority queue
 */
export const useQueue = (context?: ContextState) => {
  const { client } = useAuth();

  return useQuery<QueueItem[]>({
    queryKey: [...QUERY_KEYS.queue, context],
    queryFn: () => client!.getQueue(context),
    enabled: !!client,
    staleTime: 10000, // 10 seconds
  });
};

/**
 * Add a new item
 */
export const useAddItem = () => {
  const { client } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entityId,
      title,
      options,
    }: {
      entityId: string;
      title: string;
      options?: {
        description?: string;
        traits?: Trait[];
        tags?: string[];
        due?: string;
        time_estimate?: number;
        needs_detail?: boolean;
      };
    }) => client!.addItem(entityId, title, options),
    onSuccess: (_, variables) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.items(variables.entityId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list(variables.entityId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.queue });
    },
  });
};

/**
 * Update an item
 */
export const useUpdateItem = () => {
  const { client } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entityId,
      itemId,
      updates,
    }: {
      entityId: string;
      itemId: string;
      updates: Partial<YahtlItem>;
    }) => client!.updateItem(entityId, itemId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.items(variables.entityId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list(variables.entityId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.queue });
    },
  });
};

/**
 * Complete an item
 */
export const useCompleteItem = () => {
  const { client } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entityId,
      itemId,
      userId,
    }: {
      entityId: string;
      itemId: string;
      userId?: string;
    }) => client!.completeItem(entityId, itemId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.items(variables.entityId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list(variables.entityId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.queue });
    },
  });
};

/**
 * Delete an item
 */
export const useDeleteItem = () => {
  const { client } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entityId,
      itemId,
    }: {
      entityId: string;
      itemId: string;
    }) => client!.deleteItem(entityId, itemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.items(variables.entityId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list(variables.entityId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.queue });
    },
  });
};

/**
 * Set traits on an item
 */
export const useSetTraits = () => {
  const { client } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entityId,
      itemId,
      traits,
    }: {
      entityId: string;
      itemId: string;
      traits: Trait[];
    }) => client!.setTraits(entityId, itemId, traits),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.items(variables.entityId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.queue });
    },
  });
};

/**
 * Add tags to an item
 */
export const useAddTags = () => {
  const { client } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entityId,
      itemId,
      tags,
    }: {
      entityId: string;
      itemId: string;
      tags: string[];
    }) => client!.addTags(entityId, itemId, tags),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.items(variables.entityId) });
    },
  });
};

/**
 * Flag item as needing detail
 */
export const useFlagNeedsDetail = () => {
  const { client } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entityId,
      itemId,
      needsDetail,
    }: {
      entityId: string;
      itemId: string;
      needsDetail: boolean;
    }) => client!.flagNeedsDetail(entityId, itemId, needsDetail),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.items(variables.entityId) });
    },
  });
};

/**
 * Update context
 */
export const useUpdateContext = () => {
  const { client } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (context: ContextState) => client!.updateContext(context),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.queue });
    },
  });
};
