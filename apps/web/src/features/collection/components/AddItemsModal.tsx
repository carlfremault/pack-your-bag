'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IoShirtOutline } from 'react-icons/io5';

import { Alert } from '@repo/react-common/alert';
import { useBreakpoint } from '@repo/react-common/hooks';
import { QuantityStepper } from '@repo/react-common/input';

import { Modal } from '@/components/Modal';
import { ItemFilter } from '@/features/item/components/ItemFilter';
import ItemsList from '@/features/item/components/ItemsList';
import ItemsTable from '@/features/item/components/ItemsTable';
import { useAllItems } from '@/features/item/queries';
import { usePreferences } from '@/features/settings/queries';
import { useStateFilterItems } from '@/hooks/useStateFilterItems';
import { formatWeightForDisplay } from '@/utils/weightUtils';

import { useUpsertItemInCollection } from '../queries';
import { CollectionDetail, CollectionItemForDisplay } from '../types';

export interface AddItemsModalProps {
  collection: CollectionDetail;
}

export default function AddItemsModal(props: AddItemsModalProps) {
  const { collection } = props;

  const { isReady, isDesktop } = useBreakpoint();

  const { data = [], isLoading: isItemsLoading, isError: isItemsError } = useAllItems();
  const { data: preferences, isLoading: isPreferencesLoading } = usePreferences();
  const isLoading = isItemsLoading || isPreferencesLoading;

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { mutate: upsertItemInCollection, isPending } = useUpsertItemInCollection();

  const pendingMutations = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  useEffect(() => {
    const pending = pendingMutations.current;
    return () => {
      Object.values(pending).forEach(clearTimeout);
    };
  }, []);

  const itemsForDisplay = useMemo(() => {
    return data.map((entry) => {
      const itemQuantity =
        collection.items?.find(({ item }) => item.id === entry.id)?.quantity ?? 0;
      const hasWeight = entry.weight != null;
      const { value, unit } = hasWeight
        ? formatWeightForDisplay(Number(entry.weight), preferences?.units)
        : { value: null, unit: null };
      return { ...entry, quantity: itemQuantity, displayWeight: value, displayUnit: unit };
    });
  }, [data, collection.items, preferences?.units]);

  const { filteredItems, displayFilterState, handleFilterChange } = useStateFilterItems({
    items: itemsForDisplay,
  });

  const handleUpsertItem = useCallback(
    (itemId: string, quantity: number) => {
      setQuantities((prev) => ({ ...prev, [itemId]: quantity }));

      clearTimeout(pendingMutations.current[itemId]);
      pendingMutations.current[itemId] = setTimeout(() => {
        delete pendingMutations.current[itemId];
        if (collection.type === 'list') {
          upsertItemInCollection(
            {
              type: 'list',
              body: { itemId, listId: collection.id, quantity },
            },
            {
              onError: () => {
                setQuantities((prev) => {
                  const next = { ...prev };
                  delete next[itemId];
                  return next;
                });
              },
            },
          );
        } else if (collection.type === 'pack') {
          upsertItemInCollection(
            {
              type: 'pack',
              body: { itemId, packId: collection.id, quantity },
            },
            {
              onError: () => {
                setQuantities((prev) => {
                  const next = { ...prev };
                  delete next[itemId];
                  return next;
                });
              },
            },
          );
        }
      }, 300);
    },
    [collection.id, collection.type, upsertItemInCollection],
  );

  const itemsActions = useCallback(
    ({ id, quantity }: CollectionItemForDisplay) => (
      <QuantityStepper
        id={id}
        quantity={quantities[id] ?? quantity}
        onChange={handleUpsertItem}
        disabled={isPending}
      />
    ),
    [handleUpsertItem, quantities, isPending],
  );

  if (!isReady) return null;

  const errorContent = isItemsError && !data.length && (
    <div className="flex h-full w-full items-center justify-center p-8">
      <Alert type="error" message="Failed to load items. Please try again later." />
    </div>
  );

  const listContent = isDesktop ? (
    <div className="min-h-0 flex-1">
      <ItemsTable
        items={filteredItems}
        isLoading={isLoading}
        actionsTitle="Quantity"
        actionSize={120}
        itemsActions={itemsActions}
      />
    </div>
  ) : (
    <ItemsList items={filteredItems} isLoading={isLoading} itemsActions={itemsActions} />
  );

  return (
    <Modal.Root>
      <Modal.Trigger ariaLabel="Add items" className="w-full">
        <div className="flex items-center gap-2">
          <IoShirtOutline className="h-4 w-4" aria-hidden="true" />
          <span>Add items</span>
        </div>
      </Modal.Trigger>
      <Modal.Content title="Add items" modalWidth="3xl" className="h-full">
        <div className="flex h-full flex-col gap-4">
          {errorContent || (
            <>
              <ItemFilter filterState={displayFilterState} onChange={handleFilterChange} />
              {listContent}
            </>
          )}
        </div>
      </Modal.Content>
    </Modal.Root>
  );
}
