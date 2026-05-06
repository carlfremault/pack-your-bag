import { useCallback, useEffect, useRef } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { useUpsertItemInCollection, useUpsertListInPack } from '@/features/collection/queries';
import { CollectionDetail } from '@/features/collection/types';

export function useUpsert(collection: CollectionDetail) {
  const queryClient = useQueryClient();

  const { mutate: upsertItemInCollection, isPending: isPendingItem } = useUpsertItemInCollection();
  const { mutate: upsertListInPack, isPending: isPendingList } = useUpsertListInPack();
  const isPending = isPendingItem || isPendingList;

  const pendingMutations = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  useEffect(() => {
    const pending = pendingMutations.current;
    return () => {
      Object.values(pending).forEach(clearTimeout);
    };
  }, []);

  const handleUpsertItemInPack = useCallback(
    (itemId: string, quantity: number, packId: string) => {
      const key = `pack-item-${itemId}`;
      clearTimeout(pendingMutations.current[key]);
      pendingMutations.current[key] = setTimeout(() => {
        delete pendingMutations.current[key];
        upsertItemInCollection({ type: 'pack', body: { itemId, packId, quantity } });
      }, 600);
    },
    [upsertItemInCollection],
  );

  const handleUpsertListInPack = useCallback(
    (listId: string, quantity: number, packId: string) => {
      clearTimeout(pendingMutations.current[listId]);
      pendingMutations.current[listId] = setTimeout(() => {
        delete pendingMutations.current[listId];
        upsertListInPack({ listId, packId, quantity });
      }, 600);
    },
    [upsertListInPack],
  );

  const handleUpsertItemInList = useCallback(
    (itemId: string, quantity: number, listId: string) => {
      const key = `list-item-${itemId}`;
      clearTimeout(pendingMutations.current[key]);
      pendingMutations.current[key] = setTimeout(() => {
        delete pendingMutations.current[key];
        upsertItemInCollection(
          { type: 'list', body: { itemId, listId, quantity } },
          {
            onSuccess: async () => {
              if (collection.type === 'pack') {
                await queryClient.invalidateQueries({ queryKey: ['pack', collection.id] });
              }
            },
          },
        );
      }, 600);
    },
    [collection.id, collection.type, queryClient, upsertItemInCollection],
  );

  return {
    handleUpsertItemInList,
    handleUpsertItemInPack,
    handleUpsertListInPack,
    isPending,
  };
}
