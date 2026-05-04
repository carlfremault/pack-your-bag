'use client';

import { useCallback, useMemo } from 'react';

import { QuantityStepper } from '@repo/react-common/input';

import { ItemFilter } from '@/features/item/components/ItemFilter';
import ItemsList from '@/features/item/components/ItemsList';
import ItemsTable from '@/features/item/components/ItemsTable';
import { usePreferences } from '@/features/settings/queries';
import { useFilterItems } from '@/hooks/useFilterItems';
import { formatWeightForDisplay } from '@/utils/weightUtils';

import { CollectionDetail, CollectionItemForDisplay } from '../types';

export interface ListContentProps {
  collection: CollectionDetail;
  isDesktop: boolean;
}

export default function ListContent(props: ListContentProps) {
  const { collection, isDesktop } = props;

  const { data: preferences, isLoading: isPreferencesLoading } = usePreferences();

  const itemsForListDisplay = useMemo(() => {
    return (collection.items ?? []).map(({ quantity, item }) => {
      const hasWeight = item.weight != null;
      const { value, unit } = hasWeight
        ? formatWeightForDisplay(Number(item.weight), preferences?.units)
        : { value: null, unit: null };
      return { ...item, quantity, displayWeight: value, displayUnit: unit };
    });
  }, [collection.items, preferences?.units]);

  const { filteredItems, displayFilterState, handleFilterChange } = useFilterItems({
    items: itemsForListDisplay,
    sortFieldKey: 'listItemSortField',
    sortDirKey: 'listItemSortDir',
  });

  const itemsActions = useCallback(
    ({ quantity }: CollectionItemForDisplay) => (
      // TODO: Implement quantity stepper onChange
      <QuantityStepper quantity={quantity} onChange={() => {}} />
    ),
    [],
  );

  const listContent = isDesktop ? (
    <ItemsTable
      items={filteredItems}
      isLoading={isPreferencesLoading}
      actionsTitle="Quantity"
      actionSize={120}
      itemsActions={itemsActions}
    />
  ) : (
    <ItemsList items={filteredItems} isLoading={isPreferencesLoading} itemsActions={itemsActions} />
  );

  return (
    <>
      <h2 className="text-primary text-xl">Content</h2>
      <ItemFilter filterState={displayFilterState} onChange={handleFilterChange} />
      {listContent}
    </>
  );
}
