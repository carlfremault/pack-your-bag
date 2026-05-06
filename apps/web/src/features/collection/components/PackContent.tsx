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
import { useFilterPackContent } from '@/hooks/useFilterPackContent';
import { toCollectionListCardProps } from '@/lib/mappers/collection.mapper';
import { toItemCardProps } from '@/lib/mappers/item.mapper';
import { formatWeightForDisplay } from '@/utils/weightUtils';

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

  const { quantities, handleUpsert, handleUpsertItemInList } = useUpsert(collection);
  const { data: preferences, isLoading: isPreferencesLoading } = usePreferences();

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
      const listItems: CollectionItemForDisplay[] = (list.items ?? []).map((entry) =>
        toCollectionItemForDisplay(entry, preferences?.units),
      );
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
  }, [collection, preferences?.units]);

  const { filteredContent, displayFilterState, handleFilterChange } = useFilterPackContent({
    items: collectionItemsForDisplay,
    lists: collectionListsForDisplay,
  });

  const upsertActions = useCallback(
    ({ id, quantity, type }: CollectionItemForDisplay | CollectionListForDisplayWithItems) => (
      <QuantityStepper
        id={id}
        type={type}
        quantity={quantities[id] ?? quantity}
        onChange={handleUpsert}
      />
    ),
    [handleUpsert, quantities],
  );

  const listItemUpsertActions = useCallback(
    (listId: string, item: CollectionItemForDisplay) => (
      <QuantityStepper
        id={item.id}
        type={item.type}
        quantity={quantities[item.id] ?? item.quantity}
        onChange={(id, qty, _type) => handleUpsertItemInList(id, qty, listId)}
      />
    ),
    [handleUpsertItemInList, quantities],
  );

  let packContent: React.ReactNode;
  if (isDesktop) {
    packContent = (
      <PackContentTable
        entries={filteredContent}
        isLoading={isPreferencesLoading}
        upsertActions={upsertActions}
        listItemUpsertActions={listItemUpsertActions}
      />
    );
  } else {
    packContent = (
      <div className="mb-32 flex w-full flex-col gap-2">
        {filteredContent.map((entry) =>
          entry.entryType === 'item' ? (
            <ItemCard key={entry.id} {...toItemCardProps(entry, upsertActions(entry))} />
          ) : (
            <CollectionListCard
              key={entry.id}
              {...toCollectionListCardProps(entry, upsertActions(entry))}
              onViewDetails={() => toggleExpandedList(entry.id)}
              isExpanded={expandedLists.has(entry.id)}
              expandedContent={
                entry.listItems.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {entry.listItems.map((item) => (
                      <ItemCard
                        key={item.id}
                        {...toItemCardProps(item, listItemUpsertActions(entry.id, item))}
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
        <AddListsModal pack={collection} />
        <AddItemsModal collection={collection} />
      </div>
      <PackContentFilter filterState={displayFilterState} onChange={handleFilterChange} />
      {packContent}
    </>
  );
}
