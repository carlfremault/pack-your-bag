'use client';

import { useCallback, useMemo, useState } from 'react';

import { CollectionListCard, ItemCard } from '@repo/react-common/card';
import { QuantityStepper } from '@repo/react-common/input';

import {
  getTotalItemQuantityInList,
  getTotalWeightInList,
  toCollectionItemForDisplay,
} from '@/features/collection/utils';
import { usePreferences } from '@/features/settings/queries';
import { toCollectionListCardProps } from '@/lib/mappers/collection.mapper';
import { toItemCardProps } from '@/lib/mappers/item.mapper';
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
import { PackContentFilter } from './PackContentFilter';
import PackContentTable from './PackContentTable';

export interface PackContentProps {
  collection: CollectionDetail & { type: 'pack' };
  isDesktop: boolean;
}

export default function PackContent(props: PackContentProps) {
  const { collection, isDesktop } = props;

  const { data: preferences, isLoading: isPreferencesLoading } = usePreferences();
  const { handleUpsertItemInList, handleUpsertItemInPack, handleUpsertListInPack } =
    useUpsert(collection);

  const [expandedLists, setExpandedLists] = useState<Set<string>>(new Set());
  const toggleExpandedList = useCallback((id: string) => {
    setExpandedLists((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

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

  let packContent: React.ReactNode;
  if (isDesktop) {
    packContent = (
      <PackContentTable
        entries={filteredContent}
        isLoading={isPreferencesLoading}
        upsertActions={renderUpsertActions}
        listItemUpsertActions={renderListItemUpsertActions}
      />
    );
  } else {
    packContent = (
      <div className="mb-32 flex w-full flex-col gap-2">
        {filteredContent.map((entry) =>
          entry.entryType === 'item' ? (
            <ItemCard key={entry.id} {...toItemCardProps(entry, renderUpsertActions(entry))} />
          ) : (
            <CollectionListCard
              key={entry.id}
              {...toCollectionListCardProps(entry, renderUpsertActions(entry))}
              onViewDetails={() => toggleExpandedList(entry.id)}
              isExpanded={expandedLists.has(entry.id)}
              expandedContent={
                entry.listItems.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {entry.listItems.map((item) => (
                      <ItemCard
                        key={item.id}
                        {...toItemCardProps(item, renderListItemUpsertActions(item, entry.id))}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-primary text-sm">No items in this list</div>
                )
              }
            />
          ),
        )}
      </div>
    );
  }

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
