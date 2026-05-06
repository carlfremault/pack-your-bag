import { useCallback, useEffect, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { useUpsertItemInCollection, useUpsertListInPack } from '@/features/collection/queries';
import { CollectionDetail, UpsertType } from '@/features/collection/types';

export function useUpsert(collection: CollectionDetail) {
  const queryClient = useQueryClient();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
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

  const handleUpsert = useCallback(
    (upsertId: string, quantity: number, type: UpsertType) => {
      setQuantities((prev) => ({ ...prev, [upsertId]: quantity }));

      clearTimeout(pendingMutations.current[upsertId]);
      pendingMutations.current[upsertId] = setTimeout(() => {
        delete pendingMutations.current[upsertId];

        const clearEntry = () => {
          setQuantities((prev) => {
            const next = { ...prev };
            delete next[upsertId];
            return next;
          });
        };

        if (collection.type === 'list') {
          upsertItemInCollection(
            { type: 'list', body: { itemId: upsertId, listId: collection.id, quantity } },
            { onSuccess: clearEntry, onError: clearEntry },
          );
        } else if (collection.type === 'pack') {
          if (type === 'item') {
            upsertItemInCollection(
              { type: 'pack', body: { itemId: upsertId, packId: collection.id, quantity } },
              { onSuccess: clearEntry, onError: clearEntry },
            );
          } else if (type === 'list') {
            upsertListInPack(
              { listId: upsertId, packId: collection.id, quantity },
              { onSuccess: clearEntry, onError: clearEntry },
            );
          }
        }
      }, 300);
    },
    [collection.id, collection.type, upsertItemInCollection, upsertListInPack],
  );

  const handleUpsertItemInList = useCallback(
    (itemId: string, quantity: number, listId: string) => {
      setQuantities((prev) => ({ ...prev, [itemId]: quantity }));

      clearTimeout(pendingMutations.current[itemId]);
      pendingMutations.current[itemId] = setTimeout(() => {
        delete pendingMutations.current[itemId];

        const clearEntry = () => {
          setQuantities((prev) => {
            const next = { ...prev };
            delete next[itemId];
            return next;
          });
        };

        upsertItemInCollection(
          { type: 'list', body: { itemId, listId, quantity } },
          {
            onSuccess: async () => {
              if (collection.type === 'pack') {
                // Needs to be invalidated here as the hook has no knowledge of the pack id
                await queryClient.invalidateQueries({ queryKey: ['pack', collection.id] });
              }
              clearEntry();
            },
            onError: clearEntry,
          },
        );
      }, 300);
    },
    [collection.id, collection.type, queryClient, upsertItemInCollection],
  );

  return { quantities, handleUpsert, handleUpsertItemInList, isPending };
}
