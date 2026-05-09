'use client';

import { useCallback, useMemo } from 'react';

import { QuantityStepper } from '@repo/react-common/input';

import { ItemFilter } from '@/features/item/components/ItemFilter';
import ItemsList from '@/features/item/components/ItemsList';
import ItemsTable from '@/features/item/components/ItemsTable';
import { usePreferences } from '@/features/settings/queries';
import { useUrlFilterItems } from '@/hooks/useUrlFilterItems';
import { formatWeightForDisplay } from '@/utils/weightUtils';

import { useUpsert } from '../hooks/useUpsert';
import { CollectionDetail } from '../types';

import AddItemsModal from './AddItemsModal';

export interface ListContentProps {
  collection: CollectionDetail;
}

export default function ListContent(props: ListContentProps) {
  const { collection } = props;

  const { data: preferences } = usePreferences();
  const { handleUpsertItemInList } = useUpsert(collection);

  const itemsForListDisplay = useMemo(() => {
    return (collection.items ?? []).map(({ quantity, item }) => {
      const hasWeight = item.weight != null;
      const { value, unit } = hasWeight
        ? formatWeightForDisplay(Number(item.weight), preferences?.units)
        : { value: null, unit: null };
      return { ...item, quantity, displayWeight: value, displayUnit: unit, type: 'item' as const };
    });
  }, [collection.items, preferences?.units]);

  const { filteredItems, displayFilterState, handleFilterChange } = useUrlFilterItems({
    items: itemsForListDisplay,
    sortFieldKey: 'listItemSortField',
    sortDirKey: 'listItemSortDir',
  });

  const renderItemsUpsertActions = useCallback(
    (item: (typeof filteredItems)[number]) => (
      <QuantityStepper
        quantity={item.quantity}
        onChange={(qty) => handleUpsertItemInList(item.id, qty, collection.id)}
      />
    ),
    [handleUpsertItemInList, collection.id],
  );

  return (
    <>
      <AddItemsModal collection={collection} />
      <ItemFilter filterState={displayFilterState} onChange={handleFilterChange} />
      {/* Mobile */}
      <div className="mb-32 lg:hidden">
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
    </>
  );
}
