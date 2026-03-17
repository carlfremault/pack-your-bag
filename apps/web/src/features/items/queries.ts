import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';

import { createItem, deleteItem, updateItem } from './actions';
import { Item, UpdateItemBody } from './types';

const fetchItems = async (): Promise<Item[]> => {
  const res = await fetch('/api/item');

  if (!res.ok) {
    const body = await res.json();
    const message =
      typeof body.error === 'object' && body?.error && 'message' in body.error
        ? String((body.error as { message: unknown }).message)
        : `HTTP ${res.status}`;
    throw new Error(message);
  }
  const { data } = await res.json();
  return data;
};

const useItems = (): UseQueryResult<Item[]> => {
  return useQuery({
    queryKey: ['items'],
    queryFn: fetchItems,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

const fetchItem = async (id: string): Promise<Item> => {
  const res = await fetch(`/api/item/${id}`);

  if (!res.ok) {
    const body = await res.json();
    const message =
      typeof body.error === 'object' && body.error && 'message' in body.error
        ? String((body.error as { message: unknown }).message)
        : `HTTP ${res.status}`;
    throw new Error(message);
  }

  const { data } = await res.json();
  return data;
};

const useItem = (id: string): UseQueryResult<Item> => {
  return useQuery({
    queryKey: ['items', id],
    queryFn: () => fetchItem(id),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!id,
  });
};

const useCreateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
};

const useUpdateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateItemBody }) => updateItem(id, body),
    onSuccess: (updatedItem, { id }) => {
      if (updatedItem) {
        queryClient.setQueryData(['items', id], updatedItem);
      }
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
};

const useDeleteItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteItem,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.removeQueries({ queryKey: ['items', id] });
    },
  });
};

export { useItems, useItem, useCreateItem, useUpdateItem, useDeleteItem };
