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

import { CollectionDetail, CollectionItemForDisplay } from '../types';

export interface AddItemsModalProps {
  collection: CollectionDetail;
}

export default function AddItemsModal(props: AddItemsModalProps) {
  const { collection } = props;

  const { quantities, handleUpsert } = useUpsert(collection);
  const { isReady, isDesktop } = useBreakpoint();

  const { data = [], isLoading: isItemsLoading, isError: isItemsError } = useAllItems();
  const { data: preferences, isLoading: isPreferencesLoading } = usePreferences();
  const isLoading = isItemsLoading || isPreferencesLoading;

  const itemsForDisplay = useMemo(() => {
    return data.map((entry) => {
      const itemQuantity =
        collection.items?.find(({ item }) => item.id === entry.id)?.quantity ?? 0;
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

  const upsertActions = useCallback(
    ({ id, quantity, type }: CollectionItemForDisplay) => (
      <QuantityStepper
        id={id}
        type={type}
        quantity={quantities[id] ?? quantity}
        onChange={handleUpsert}
      />
    ),
    [handleUpsert, quantities],
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
        itemsActions={upsertActions}
      />
    </div>
  ) : (
    <ItemsList items={filteredItems} isLoading={isLoading} itemsActions={upsertActions} />
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
