'use client';

import { useCallback, useMemo } from 'react';
import { IoShirtOutline } from 'react-icons/io5';

import { Alert } from '@repo/react-common/alert';
import { useBreakpoint } from '@repo/react-common/hooks';
import { QuantityStepper } from '@repo/react-common/input';

import { Modal } from '@/components/Modal';
import { useUpsert } from '@/features/collection/hooks/useUpsert';
import { ItemFilter } from '@/features/item/components/ItemFilter';
import ItemsList from '@/features/item/components/ItemsList';
import ItemsTable from '@/features/item/components/ItemsTable';
import { useAllItems } from '@/features/item/queries';
import { usePreferences } from '@/features/settings/queries';
import { useStateFilterItems } from '@/hooks/useStateFilterItems';
import { formatWeightForDisplay } from '@/utils/weightUtils';

import { CollectionDetail } from '../types';

export interface AddItemsModalProps {
  collection: CollectionDetail;
}

export default function AddItemsModal(props: AddItemsModalProps) {
  const { collection } = props;

  const { isReady, isDesktop } = useBreakpoint();

  const { data = [], isLoading: isItemsLoading, isError: isItemsError } = useAllItems();
  const { data: preferences, isLoading: isPreferencesLoading } = usePreferences();
  const isLoading = isItemsLoading || isPreferencesLoading;

  const { handleUpsertItemInList, handleUpsertItemInPack } = useUpsert(collection);

  const itemsForDisplay = useMemo(() => {
    const collectionItemMap = new Map(
      collection.items?.map(({ item, quantity }) => [item.id, quantity]) ?? [],
    );
    return data.map((entry) => {
      const itemQuantity = collectionItemMap.get(entry.id) ?? 0;
      const hasWeight = entry.weight != null;
      const { value, unit } = hasWeight
        ? formatWeightForDisplay(Number(entry.weight), preferences?.units)
        : { value: null, unit: null };
      return {
        ...entry,
        quantity: itemQuantity,
        displayWeight: value,
        displayUnit: unit,
        type: 'item' as const,
      };
    });
  }, [data, collection.items, preferences?.units]);

  const { filteredItems, displayFilterState, handleFilterChange } = useStateFilterItems({
    items: itemsForDisplay,
  });

  const renderItemsUpsertActions = useCallback(
    (item: (typeof filteredItems)[number]) => {
      const handleChange =
        collection.type === 'list'
          ? (qty: number) => handleUpsertItemInList(item.id, qty, collection.id)
          : (qty: number) => handleUpsertItemInPack(item.id, qty, collection.id);

      return <QuantityStepper quantity={item.quantity} onChange={handleChange} />;
    },
    [handleUpsertItemInList, handleUpsertItemInPack, collection.id, collection.type],
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
        itemsActions={renderItemsUpsertActions}
      />
    </div>
  ) : (
    <ItemsList
      items={filteredItems}
      isLoading={isLoading}
      itemsActions={renderItemsUpsertActions}
    />
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
