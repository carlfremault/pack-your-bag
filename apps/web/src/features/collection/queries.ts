import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query';

import { toHttpError } from '@/utils/http-error';

import {
  Collection,
  CollectionDetail,
  CollectionType,
  CreateListBody,
  CreatePackBody,
  ItemList,
  ItemPack,
  List,
  ListDeleteImpact,
  ListPack,
  Pack,
  PackDeleteImpact,
  UpdateListBody,
  UpdatePackBody,
  UpsertItemListBody,
  UpsertItemPackBody,
  UpsertListInPackBody,
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
// Fetch collection (List or Pack)
// -------------------------------

const fetchCollection = async (id?: string, type?: CollectionType): Promise<CollectionDetail> => {
  const res = await fetch(`/api/${type}/${id}`);

  if (!res.ok) {
    throw await toHttpError(res);
  }
  const { data } = await res.json();
  return { ...data, type };
};

const useCollection = (id?: string, type?: CollectionType): UseQueryResult<CollectionDetail> => {
  return useQuery({
    queryKey: [type, id],
    queryFn: () => fetchCollection(id, type),
    enabled: !!id,
  });
};

// -------------------------------
// Fetch all lists
// -------------------------------

const useAllLists = (listIds: string[]) => {
  return useQueries({
    queries: listIds.map((id) => ({
      queryKey: ['list', id],
      queryFn: () => fetchCollection(id, 'list'),
      enabled: !!id,
    })),
    combine: (results) => ({
      detailsById: results.reduce<Record<string, CollectionDetail>>((acc, q) => {
        if (q.data) acc[q.data.id] = q.data;
        return acc;
      }, {}),
      isLoading: results.some((q) => q.isPending),
    }),
  });
};

// --------------------------------
// Create Collection (List or Pack)
// --------------------------------

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

// --------------------------------
// Update Collection (List or Pack)
// --------------------------------

type UpdateCollectionVariables =
  | { id: string; type: 'list'; body: UpdateListBody }
  | { id: string; type: 'pack'; body: UpdatePackBody };

const updateCollection = async ({
  id,
  type,
  body,
}: UpdateCollectionVariables): Promise<List | Pack> => {
  const res = await fetch(`/api/${type}/${id}`, {
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

const useUpdateCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCollection,
    onMutate: async ({ id, type, body }) => {
      await queryClient.cancelQueries({ queryKey: ['collections'] });
      await queryClient.cancelQueries({ queryKey: [type, id] });

      const previousCollection = queryClient.getQueryData<CollectionDetail>([type, id]);

      queryClient.setQueryData([type, id], (old: CollectionDetail) => ({
        ...old,
        ...body,
        updatedAt: new Date().toISOString(),
      }));

      return { previousCollection, type, id };
    },
    onError: (_error, _body, context) => {
      if (context?.previousCollection !== undefined) {
        queryClient.setQueryData([context.type, context.id], context.previousCollection);
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: [variables.type, variables.id] });
    },
  });
};

// -------------------------------------------
// Get collection delete impact (List or Pack)
// -------------------------------------------

type CollectionDeleteVariables = { type: 'list'; id: string } | { type: 'pack'; id: string };

const fetchCollectionDeleteImpact = async ({
  type,
  id,
}: CollectionDeleteVariables): Promise<ListDeleteImpact | PackDeleteImpact> => {
  const res = await fetch(`/api/${type}/${id}/delete-impact`);

  if (!res.ok) {
    throw await toHttpError(res);
  }
  const { data } = await res.json();
  return data;
};

const useCollectionDeleteImpact = ({
  type,
  id,
}: CollectionDeleteVariables): UseQueryResult<ListDeleteImpact | PackDeleteImpact> => {
  return useQuery({
    queryKey: ['deleteImpact', type, id],
    queryFn: () => fetchCollectionDeleteImpact({ type, id }),
    enabled: !!id,
  });
};

// ----------------------------------
// Delete collection (List or Pack)
// ----------------------------------

const deleteCollection = async ({ type, id }: CollectionDeleteVariables): Promise<void> => {
  const res = await fetch(`/api/${type}/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw await toHttpError(res);
  }
};

const useDeleteCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCollection,
    onMutate: async ({ type, id }) => {
      await queryClient.cancelQueries({ queryKey: ['collections'] });
      await queryClient.cancelQueries({ queryKey: [type, id] });

      const previousCollections = queryClient.getQueryData<Collection[]>(['collections']) ?? [];

      queryClient.setQueryData(['collections'], (old: Collection[] = []) =>
        old.filter((collection) => collection.id !== id),
      );

      return { previousCollections };
    },
    onError: (_error, _id, context) => {
      if (context?.previousCollections !== undefined) {
        queryClient.setQueryData(['collections'], context.previousCollections);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
};

// --------------------------------------------------
// Upsert or remove Item in Collection (List or Pack)
// --------------------------------------------------

type UpsertItemCollectionVariables =
  | { type: 'list'; body: UpsertItemListBody }
  | { type: 'pack'; body: UpsertItemPackBody };

const upsertItemInCollection = async ({
  type,
  body,
}: UpsertItemCollectionVariables): Promise<ItemList | ItemPack | void> => {
  const itemId = body.itemId;
  const collectionId = type === 'list' ? body.listId : body.packId;

  if (body.quantity === 0) {
    const res = await fetch(`/api/item-${type}/${itemId}/${collectionId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw await toHttpError(res);
    }
    return;
  }

  const res = await fetch(`/api/item-${type}`, {
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

const useUpsertItemInCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertItemInCollection,
    onMutate: async ({ type, body }) => {
      const id = type === 'list' ? body.listId : body.packId;
      await queryClient.cancelQueries({ queryKey: [type, id] });

      const previousCollection = queryClient.getQueryData<CollectionDetail>([type, id]);

      if (body.quantity === 0) {
        queryClient.setQueryData([type, id], (old: CollectionDetail) => ({
          ...old,
          items: (old.items ?? []).filter(({ item }) => item.id !== body.itemId),
        }));
      } else {
        queryClient.setQueryData([type, id], (old: CollectionDetail) => {
          const existingItems = old.items ?? [];
          const existingIndex = existingItems.findIndex(({ item }) => item.id === body.itemId);
          const existing = existingItems[existingIndex];
          if (existingIndex >= 0 && existing) {
            const updated = [...existingItems];
            updated[existingIndex] = { ...existing, quantity: body.quantity };
            return { ...old, items: updated };
          }
          return {
            ...old,
            items: [
              ...existingItems,
              {
                item: {
                  id: body.itemId,
                  name: '',
                },
                quantity: body.quantity,
              },
            ],
          };
        });
      }

      return { previousCollection, type, id };
    },
    onError: (_error, _body, context) => {
      if (context?.previousCollection !== undefined) {
        queryClient.setQueryData([context.type, context.id], context.previousCollection);
      }
    },
    onSuccess: (_data, variables) => {
      const id = variables.type === 'list' ? variables.body.listId : variables.body.packId;
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: [variables.type, id] });
    },
  });
};

// ----------------------------------
// Upsert or remove List in Pack
// ----------------------------------

const upsertListInPack = async (body: UpsertListInPackBody): Promise<ListPack | void> => {
  if (body.quantity === 0) {
    const res = await fetch(`/api/list-pack/${body.listId}/${body.packId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw await toHttpError(res);
    }
    return;
  }

  const res = await fetch('/api/list-pack', {
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

const useUpsertListInPack = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertListInPack,
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: ['pack', body.packId] });

      const previousPack = queryClient.getQueryData<CollectionDetail>(['pack', body.packId]);

      if (body.quantity === 0) {
        queryClient.setQueryData(
          ['pack', body.packId],
          (old: CollectionDetail & { type: 'pack' }) => ({
            ...old,
            lists: (old.lists ?? []).filter(({ list }) => list.id !== body.listId),
          }),
        );
      } else {
        queryClient.setQueryData(
          ['pack', body.packId],
          (old: CollectionDetail & { type: 'pack' }) => {
            const existingLists = old.lists ?? [];
            const existingIndex = existingLists.findIndex(({ list }) => list.id === body.listId);
            const existing = existingLists[existingIndex];
            if (existingIndex >= 0 && existing) {
              const updated = [...existingLists];
              updated[existingIndex] = { ...existing, quantity: body.quantity };
              return { ...old, lists: updated };
            }
            return {
              ...old,
              lists: [
                ...existingLists,
                {
                  list: {
                    id: body.listId,
                    name: '',
                  },
                  quantity: body.quantity,
                },
              ],
            };
          },
        );
      }

      return { previousPack, id: body.packId };
    },
    onError: (_error, _body, context) => {
      if (context?.previousPack !== undefined) {
        queryClient.setQueryData(['pack', context.id], context.previousPack);
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['pack', variables.packId] });
    },
  });
};

export {
  useAllCollections,
  useAllLists,
  useCollection,
  useCreateCollection,
  useUpdateCollection,
  useCollectionDeleteImpact,
  useDeleteCollection,
  useUpsertItemInCollection,
  useUpsertListInPack,
};
