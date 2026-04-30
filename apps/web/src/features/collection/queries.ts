import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';

import { toHttpError } from '@/utils/http-error';

import { Collection, CreateListBody, CreatePackBody, List, Pack } from './types';

// -------------------------------
// Fetch all collections
// -------------------------------
const fetchAllCollections = async (): Promise<Collection[]> => {
  const res = await fetch('/api/collections');

  if (!res.ok) {
    throw await toHttpError(res);
  }
  const { data } = await res.json();
  return data;
};

const useAllCollections = (): UseQueryResult<Collection[]> => {
  return useQuery({
    queryKey: ['collections'],
    queryFn: fetchAllCollections,
  });
};

// -------------------------------
// Fetch list
// -------------------------------
const fetchList = async (id: string): Promise<List> => {
  const res = await fetch(`/api/list/${id}`);

  if (!res.ok) {
    throw await toHttpError(res);
  }
  const { data } = await res.json();
  return data;
};

const useList = (id: string): UseQueryResult<List> => {
  return useQuery({
    queryKey: ['list', id],
    queryFn: () => fetchList(id),
    enabled: !!id,
  });
};

// -------------------------------
// Fetch pack
// -------------------------------
const fetchPack = async (id: string): Promise<Pack> => {
  const res = await fetch(`/api/pack/${id}`);

  if (!res.ok) {
    throw await toHttpError(res);
  }
  const { data } = await res.json();
  return data;
};

const usePack = (id: string): UseQueryResult<Pack> => {
  return useQuery({
    queryKey: ['pack', id],
    queryFn: () => fetchPack(id),
    enabled: !!id,
  });
};

// -------------------------------
// Create Collection (List or Pack)
// -------------------------------

type CreateCollectionVariables =
  | { type: 'list'; body: CreateListBody }
  | { type: 'pack'; body: CreatePackBody };

const createCollection = async ({
  type,
  body,
}: CreateCollectionVariables): Promise<List | Pack> => {
  const res = await fetch(`/api/${type}`, {
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

const nextOptimisticCollectionId = () => `optimistic-${crypto.randomUUID()}`;

const useCreateCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCollection,
    onMutate: async ({ type, body }) => {
      await queryClient.cancelQueries({ queryKey: ['collections'] });

      const previousCollections = queryClient.getQueryData<Collection[]>(['collections']) ?? [];

      const optimisticId = nextOptimisticCollectionId();
      const optimisticCollection: Collection = {
        id: optimisticId,
        type,
        name: body.name,
        description: body.description ?? null,
        colorTheme: body.colorTheme ?? null,
        numberOfItems: 0,
        totalWeight: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData(['collections'], (old: Collection[] = []) => [
        ...old,
        optimisticCollection,
      ]);

      return { previousCollections, optimisticId };
    },
    onError: (_error, _body, context) => {
      if (context?.previousCollections !== undefined) {
        queryClient.setQueryData(['collections'], context.previousCollections);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
};

export { useAllCollections, useList, usePack, useCreateCollection };
