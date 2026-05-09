import { useState } from 'react';

import { CollectionListCard, ItemCard } from '@repo/react-common/card';

import { toCollectionListCardProps } from '@/lib/mappers/collection.mapper';
import { toItemCardProps } from '@/lib/mappers/item.mapper';

import {
  CollectionItemForDisplay,
  CollectionListForDisplayWithItems,
  PackContentRow,
} from '../types';

interface PackContentCardsProps {
  entries: PackContentRow[];
  renderUpsertActions: (
    entry: CollectionItemForDisplay | CollectionListForDisplayWithItems,
  ) => React.ReactNode;
  renderListItemUpsertActions: (item: CollectionItemForDisplay, listId: string) => React.ReactNode;
}

export default function PackContentCards(props: PackContentCardsProps) {
  const { entries, renderUpsertActions, renderListItemUpsertActions } = props;

  const [expandedLists, setExpandedLists] = useState<Set<string>>(new Set());
  const toggleExpandedList = (id: string) => {
    setExpandedLists((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="mb-32 flex w-full flex-col gap-2">
      {entries.map((entry) =>
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
