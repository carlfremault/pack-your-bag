'use client';

import { useCallback, useMemo, useState } from 'react';

import { CollectionListCard, ItemCard } from '@repo/react-common/card';
import { QuantityStepper } from '@repo/react-common/input';

import { getTotalItemQuantityInList, getTotalWeightInList } from '@/features/collection/utils';
import { Item } from '@/features/item/types';
import { usePreferences } from '@/features/settings/queries';
import { useFilterPackContent } from '@/hooks/useFilterPackContent';
import { toCollectionListCardProps } from '@/lib/mappers/collection.mapper';
import { toItemCardProps } from '@/lib/mappers/item.mapper';
import { formatWeightForDisplay } from '@/utils/weightUtils';

import {
  CollectionDetail,
  CollectionItemForDisplay,
  CollectionListForDisplayWithItems,
} from '../types';

import { PackContentFilter } from './PackContentFilter';
import PackContentTable from './PackContentTable';

function toCollectionItemForDisplay(
  { quantity, item }: { quantity: number; item: Item },
  units?: string,
): CollectionItemForDisplay {
  const { value, unit } =
    item.weight != null
      ? formatWeightForDisplay(Number(item.weight), units)
      : { value: null, unit: null };
  return { ...item, quantity, displayWeight: value, displayUnit: unit };
}

export interface PackContentProps {
  collection: CollectionDetail;
  isDesktop: boolean;
}

export default function PackContent(props: PackContentProps) {
  const { collection, isDesktop } = props;

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
    if (collection.type !== 'pack') return [];
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

  const itemsActions = useCallback(
    ({ quantity }: CollectionItemForDisplay | CollectionListForDisplayWithItems) => (
      // TODO: Implement quantity stepper onChange
      <QuantityStepper quantity={quantity} onChange={() => {}} />
    ),
    [],
  );

  let packContent: React.ReactNode;
  if (isDesktop) {
    packContent = (
      <PackContentTable
        entries={filteredContent}
        isLoading={isPreferencesLoading}
        itemsActions={itemsActions}
      />
    );
  } else {
    packContent = (
      <div className="flex w-full flex-col gap-2">
        {filteredContent.map((entry) =>
          entry.entryType === 'item' ? (
            <ItemCard
              key={entry.id}
              {...toItemCardProps(entry, <div className="flex gap-8">{itemsActions(entry)}</div>)}
            />
          ) : (
            <CollectionListCard
              key={entry.id}
              {...toCollectionListCardProps(entry, itemsActions(entry))}
              onViewDetails={() => toggleExpandedList(entry.id)}
              isExpanded={expandedLists.has(entry.id)}
              expandedContent={
                <div className="flex flex-col gap-2">
                  {entry.listItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      {...toItemCardProps(
                        item,
                        <div className="flex gap-8">{itemsActions(item)}</div>,
                      )}
                    />
                  ))}
                </div>
              }
            />
          ),
        )}
      </div>
    );
  }

  return (
    <>
      <h2 className="text-primary text-xl">Content</h2>
      <PackContentFilter filterState={displayFilterState} onChange={handleFilterChange} />
      {packContent}
    </>
  );
}
