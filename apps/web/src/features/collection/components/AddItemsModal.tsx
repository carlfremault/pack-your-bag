'use client';

import { useCallback, useMemo } from 'react';
import { IoShirtOutline } from 'react-icons/io5';

import { Alert } from '@repo/react-common/alert';
import { useBreakpoint } from '@repo/react-common/hooks';
import { QuantityStepper } from '@repo/react-common/input';
import { PageNotReady } from '@repo/react-common/utils';

import { Modal } from '@/components/Modal';
import { ItemFilter } from '@/features/item/components/ItemFilter';
import ItemsList from '@/features/item/components/ItemsList';
import ItemsTable from '@/features/item/components/ItemsTable';
import { useAllItems } from '@/features/item/queries';
import { usePreferences } from '@/features/settings/queries';
import { useStateFilterItems } from '@/hooks/useStateFilterItems';
import { formatWeightForDisplay } from '@/utils/weightUtils';

import { CollectionItemForDisplay } from '../types';

export default function AddItemsModal() {
  const { isReady, isDesktop } = useBreakpoint();

  const { data = [], isLoading: isItemsLoading, isError: isItemsError } = useAllItems();
  const { data: preferences, isLoading: isPreferencesLoading } = usePreferences();
  const isLoading = isItemsLoading || isPreferencesLoading;

  const itemsForDisplay = useMemo(() => {
    return data.map((item) => {
      const hasWeight = item.weight != null;
      const { value, unit } = hasWeight
        ? formatWeightForDisplay(Number(item.weight), preferences?.units)
        : { value: null, unit: null };
      return { ...item, quantity: 0, displayWeight: value, displayUnit: unit };
    });
  }, [data, preferences?.units]);

  const { filteredItems, displayFilterState, handleFilterChange } = useStateFilterItems({
    items: itemsForDisplay,
  });

  const itemsActions = useCallback(
    ({ quantity }: CollectionItemForDisplay) => (
      // TODO: Implement quantity stepper onChange
      <QuantityStepper quantity={quantity} onChange={() => {}} />
    ),
    [],
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
      <Modal.Trigger>
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
