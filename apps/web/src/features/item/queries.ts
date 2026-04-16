import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';

import { toHttpError } from '@/utils/http-error';

import { CreateItemBody, Item } from './types';

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
      queryClient.setQueryData(['items'], context?.previousItems);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
};

export { fetchAllItems, useAllItems, useCreateItem };
