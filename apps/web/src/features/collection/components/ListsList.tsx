import { useCallback, useState } from 'react';

import { CollectionListCard, ItemCard } from '@repo/react-common/card';

import { toCollectionListCardProps } from '@/lib/mappers/collection.mapper';
import { toItemCardProps } from '@/lib/mappers/item.mapper';

import { CollectionItemForDisplay, CollectionListForDisplayWithItems } from '../types';

import ListsListSkeleton from './ListsListSkeleton';

interface ListsListProps {
  lists: CollectionListForDisplayWithItems[];
  isLoading: boolean;
  upsertActions: (upsertItem: CollectionListForDisplayWithItems) => React.ReactNode;
  listItemUpsertActions: (listId: string, item: CollectionItemForDisplay) => React.ReactNode;
}

export default function ListsList(props: ListsListProps) {
  const { lists, isLoading, upsertActions, listItemUpsertActions } = props;

  const [expandedLists, setExpandedLists] = useState<Set<string>>(new Set());
  const toggleExpandedList = useCallback((id: string) => {
    setExpandedLists((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const containerClassName = 'flex w-full flex-col gap-2';

  if (isLoading) {
    return <ListsListSkeleton className={containerClassName} />;
  }

  if (!lists.length) {
    return (
      <div className={containerClassName}>
        <div className="bg-surface border-primary-ring text-primary rounded-md border p-6 text-center text-sm">
          No lists found
        </div>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      {lists.map((list) => (
        <CollectionListCard
          key={list.id}
          {...toCollectionListCardProps(list, upsertActions(list))}
          onViewDetails={() => toggleExpandedList(list.id)}
          isExpanded={expandedLists.has(list.id)}
          expandedContent={
            list.listItems.length > 0 ? (
              <div className="flex flex-col gap-2">
                {list.listItems
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((item) => (
                    <ItemCard
                      key={item.id}
                      {...toItemCardProps(item, listItemUpsertActions(list.id, item))}
                    />
                  ))}
              </div>
            ) : (
              <div className="text-primary text-sm">No items in this list</div>
            )
          }
        />
      ))}
    </div>
  );
}
