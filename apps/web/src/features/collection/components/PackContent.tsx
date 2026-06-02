'use client';

import { useCallback, useMemo } from 'react';

import { QuantityStepper } from '@repo/react-common/input';

import { EmptyState } from '@/components/EmptyState';
import {
  getTotalItemQuantityInList,
  getTotalWeightInList,
  toCollectionItemForDisplay,
} from '@/features/collection/utils';
import { usePreferences } from '@/features/settings/queries';
import { formatWeightForDisplay } from '@/utils/weightUtils';

import { useFilterPackContent } from '../hooks/useFilterPackContent';
import { useUpsert } from '../hooks/useUpsert';
import {
  CollectionDetail,
  CollectionItemForDisplay,
  CollectionListForDisplayWithItems,
} from '../types';

import PackContentCards from './PackContentCards';
import { PackContentFilter } from './PackContentFilter';
import PackContentTable from './PackContentTable';

export interface PackContentProps {
  collection: CollectionDetail & { type: 'pack' };
}

export default function PackContent(props: PackContentProps) {
  const { collection } = props;

  const { data: preferences } = usePreferences();
  const { handleUpsertItemInList, handleUpsertItemInPack, handleUpsertListInPack } =
    useUpsert(collection);

  const collectionItemsForDisplay = useMemo((): CollectionItemForDisplay[] => {
    return (collection.items ?? []).map((entry) =>
      toCollectionItemForDisplay(entry, preferences?.units),
    );
  }, [collection.items, preferences?.units]);

  const collectionListsForDisplay = useMemo((): CollectionListForDisplayWithItems[] => {
    return (collection.lists ?? []).map(({ quantity, list }) => {
      const totalWeight = getTotalWeightInList(list);
      const itemCount = getTotalItemQuantityInList(list);
      const { value, unit } = formatWeightForDisplay(totalWeight, preferences?.units);
      const listItems: CollectionItemForDisplay[] = (list.items ?? [])
        .map((entry) => toCollectionItemForDisplay(entry, preferences?.units))
        .sort((a, b) => a.name.localeCompare(b.name));
      return {
        ...list,
        type: 'list' as const,
        itemCount,
        totalWeight,
        quantity,
        displayWeight: value,
        displayUnit: unit,
        listItems,
      };
    });
  }, [collection.lists, preferences?.units]);

  const { filteredContent, displayFilterState, handleFilterChange } = useFilterPackContent({
    items: collectionItemsForDisplay,
    lists: collectionListsForDisplay,
  });

  const renderUpsertActions = useCallback(
    (entry: CollectionItemForDisplay | CollectionListForDisplayWithItems) => {
      const handleChange = entry.type === 'item' ? handleUpsertItemInPack : handleUpsertListInPack;
      return (
        <QuantityStepper
          quantity={entry.quantity}
          onChange={(qty) => handleChange(entry.id, qty, collection.id)}
        />
      );
    },
    [handleUpsertItemInPack, handleUpsertListInPack, collection.id],
  );

  const renderListItemUpsertActions = useCallback(
    (item: CollectionItemForDisplay, listId: string) => (
      <QuantityStepper
        quantity={item.quantity}
        onChange={(qty) => handleUpsertItemInList(item.id, qty, listId)}
      />
    ),
    [handleUpsertItemInList],
  );

  const noResults = (
    <EmptyState
      message="No content found."
      suggestion="Fill up your pack to prepare your trip!"
      hasActiveFilters={!!displayFilterState.search || displayFilterState.contentType !== 'all'}
    />
  );

  return (
    <>
      <PackContentFilter filterState={displayFilterState} onChange={handleFilterChange} />
      {/* Mobile */}
      <div className="lg:hidden">
        <PackContentCards
          entries={filteredContent}
          renderUpsertActions={renderUpsertActions}
          renderListItemUpsertActions={renderListItemUpsertActions}
          noResults={noResults}
        />
      </div>
      {/* Desktop */}
      <div className="hidden min-h-0 flex-1 lg:flex">
        <PackContentTable
          entries={filteredContent}
          upsertActions={renderUpsertActions}
          listItemUpsertActions={renderListItemUpsertActions}
          noResults={noResults}
        />
      </div>
    </>
  );
}
