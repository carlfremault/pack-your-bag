'use client';

import { Suspense, useCallback, useMemo } from 'react';
import { IoShirtOutline } from 'react-icons/io5';

import { QuantityStepper } from '@repo/react-common/input';

import { Modal } from '@/components/Modal';
import { AddModalTitle } from '@/components/Modal/ModalTitle';
import { useUpsert } from '@/features/collection/hooks/useUpsert';
import { ItemFilter } from '@/features/item/components/ItemFilter';
import ItemsList from '@/features/item/components/ItemsList';
import ItemsTable from '@/features/item/components/ItemsTable';
import { useAllItems } from '@/features/item/queries';
import { usePreferences } from '@/features/settings/queries';
import { formatWeightForDisplay } from '@/utils/weightUtils';

import { useStateFilterItems } from '../hooks/useStateFilterItems';
import { CollectionDetail } from '../types';

import AddItemsModalSkeleton from './AddItemsModalSkeleton';

export interface AddItemsModalProps {
  collection: CollectionDetail;
}

export default function AddItemsModal(props: AddItemsModalProps) {
  const { collection } = props;

  const { handleUpsertItemInList, handleUpsertItemInPack } = useUpsert(collection);

  return (
    <Modal.Root>
      <Modal.Trigger ariaLabel="Add items" className="w-full">
        <div className="flex items-center gap-2">
          <IoShirtOutline className="h-4 w-4" aria-hidden="true" />
          <span>Add items</span>
        </div>
      </Modal.Trigger>
      <Modal.Content
        title={<AddModalTitle label="Add items" />}
        modalWidth="3xl"
        className="h-full"
      >
        <Suspense fallback={<AddItemsModalSkeleton />}>
          <AddItemsModalContent
            collection={collection}
            handleUpsertItemInList={handleUpsertItemInList}
            handleUpsertItemInPack={handleUpsertItemInPack}
          />
        </Suspense>
      </Modal.Content>
    </Modal.Root>
  );
}

interface AddItemsModalContentProps {
  collection: CollectionDetail;
  handleUpsertItemInList: (itemId: string, quantity: number, listId: string) => void;
  handleUpsertItemInPack: (itemId: string, quantity: number, packId: string) => void;
}

function AddItemsModalContent(props: AddItemsModalContentProps) {
  const { collection, handleUpsertItemInList, handleUpsertItemInPack } = props;

  const { data: items } = useAllItems();
  const { data: preferences } = usePreferences();

  const itemsForDisplay = useMemo(() => {
    const collectionItemMap = new Map(
      collection.items?.map(({ item, quantity }) => [item.id, quantity]) ?? [],
    );
    return items.map((item) => {
      const itemQuantity = collectionItemMap.get(item.id) ?? 0;
      const hasWeight = item.weight != null;
      const { value, unit } = hasWeight
        ? formatWeightForDisplay(Number(item.weight), preferences?.units)
        : { value: null, unit: null };
      return {
        ...item,
        quantity: itemQuantity,
        displayWeight: value,
        displayUnit: unit,
        type: 'item' as const,
      };
    });
  }, [items, collection.items, preferences?.units]);

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

  return (
    <div className="flex h-full flex-col gap-4">
      <ItemFilter filterState={displayFilterState} onChange={handleFilterChange} />
      {/* Mobile */}
      <div className="lg:hidden">
        <ItemsList items={filteredItems} itemsActions={renderItemsUpsertActions} />
      </div>
      {/* Desktop */}
      <div className="hidden min-h-0 flex-1 lg:block">
        <ItemsTable
          items={filteredItems}
          actionsTitle="Quantity"
          actionSize={120}
          itemsActions={renderItemsUpsertActions}
        />
      </div>
    </div>
  );
}
