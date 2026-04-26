import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';

import { toHttpError } from '@/utils/http-error';

import { CreateItemBody, Item, UpdateItemBody } from './types';

// -------------------------------
// Fetch all items
// -------------------------------
const fetchAllItems = async (): Promise<Item[]> => {
  const res = await fetch('/api/item');

  if (!res.ok) {
    throw await toHttpError(res);
  }
  const { data } = await res.json();
  return data;
};

const useAllItems = (): UseQueryResult<Item[]> => {
  return useQuery({
    queryKey: ['items'],
    queryFn: fetchAllItems,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

// -------------------------------
// Create item
// -------------------------------
const createItem = async (body: CreateItemBody): Promise<Item> => {
  const res = await fetch('/api/item', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw await toHttpError(res);
  }
  const { data } = await res.json();
  return data;
};

const nextOptimisticId = () => `optimistic-${crypto.randomUUID()}`;

const useCreateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createItem,
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: ['items'] });

      const previousItems = queryClient.getQueryData<Item[]>(['items']) ?? [];

      const optimisticId = nextOptimisticId();
      const optimisticItem: Item = {
        id: optimisticId,
        name: body.name,
        description: body.description ?? null,
        weight: body.weight ?? null,
        category: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData(['items'], (old: Item[] = []) => [...old, optimisticItem]);

      return { previousItems, optimisticId };
    },
    onError: (_error, _body, context) => {
      if (context?.previousItems !== undefined) {
        queryClient.setQueryData(['items'], context.previousItems);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
};

// -------------------------------
// Update item
// -------------------------------
const updateItem = async (id: string, body: UpdateItemBody): Promise<Item> => {
  const res = await fetch(`/api/item/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw await toHttpError(res);
  }
  const { data } = await res.json();
  return data;
};

const useUpdateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateItemBody }) => updateItem(id, body),
    onMutate: async ({ id, body }) => {
      await queryClient.cancelQueries({ queryKey: ['items'] });

      const previousItems = queryClient.getQueryData<Item[]>(['items']) ?? [];

      queryClient.setQueryData(['items'], (old: Item[] = []) =>
        old.map((item) =>
          item.id === id ? { ...item, ...body, updatedAt: new Date().toISOString() } : item,
        ),
      );

      return { previousItems };
    },
    onError: (_error, _body, context) => {
      if (context?.previousItems !== undefined) {
        queryClient.setQueryData(['items'], context.previousItems);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
};

// -------------------------------
// Delete item
// -------------------------------
const deleteItem = async (id: string): Promise<void> => {
  const res = await fetch(`/api/item/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw await toHttpError(res);
  }
};

const useDeleteItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteItem,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['items'] });

      const previousItems = queryClient.getQueryData<Item[]>(['items']) ?? [];

      queryClient.setQueryData(['items'], (old: Item[] = []) =>
        old.filter((item) => item.id !== id),
      );

      return { previousItems };
    },
    onError: (_error, _id, context) => {
      if (context?.previousItems !== undefined) {
        queryClient.setQueryData(['items'], context.previousItems);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
};

export { useAllItems, useCreateItem, useUpdateItem, useDeleteItem };
