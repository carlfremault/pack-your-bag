'use client';

import { useCallback, useMemo } from 'react';

import { QuantityStepper } from '@repo/react-common/input';

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

import AddItemsModal from './AddItemsModal';
import AddListsModal from './AddListsModal';
import PackContentCards from './PackContentCards';
import { PackContentFilter } from './PackContentFilter';
import PackContentTable from './PackContentTable';

export interface PackContentProps {
  collection: CollectionDetail & { type: 'pack' };
  isDesktop: boolean;
}

export default function PackContent(props: PackContentProps) {
  const { collection, isDesktop } = props;

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

  const packContent = isDesktop ? (
    <PackContentTable
      entries={filteredContent}
      upsertActions={renderUpsertActions}
      listItemUpsertActions={renderListItemUpsertActions}
    />
  ) : (
    <PackContentCards
      entries={filteredContent}
      renderUpsertActions={renderUpsertActions}
      renderListItemUpsertActions={renderListItemUpsertActions}
    />
  );

  return (
    <>
      <div className="flex w-full items-center justify-between gap-4">
        <AddItemsModal collection={collection} />
        <AddListsModal pack={collection} />
      </div>
      <PackContentFilter filterState={displayFilterState} onChange={handleFilterChange} />
      {packContent}
    </>
  );
}
