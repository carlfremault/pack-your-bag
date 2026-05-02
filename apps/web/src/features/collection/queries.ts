import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';

import { toHttpError } from '@/utils/http-error';

import {
  Collection,
  CollectionDetail,
  CollectionType,
  CreateListBody,
  CreatePackBody,
  List,
  Pack,
} from './types';

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
// Fetch collection
// -------------------------------
const fetchCollection = async (id: string, type: CollectionType): Promise<CollectionDetail> => {
  const res = await fetch(`/api/${type}/${id}`);

  if (!res.ok) {
    throw await toHttpError(res);
  }
  const { data } = await res.json();
  return { ...data, type };
};

const useCollection = (id: string, type: CollectionType): UseQueryResult<CollectionDetail> => {
  return useQuery({
    queryKey: [type, id],
    queryFn: () => fetchCollection(id, type),
    enabled: !!id && !!type,
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
      const optimisticCollection = {
        id: optimisticId,
        type,
        name: body.name,
        description: body.description ?? null,
        colorTheme: body.colorTheme ?? null,
        itemCount: 0,
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

export { useAllCollections, useCollection, useCreateCollection };
