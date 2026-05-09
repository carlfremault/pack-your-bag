import { ItemCard } from '@repo/react-common/card';

import { toItemCardProps } from '@/lib/mappers/item.mapper';

import { ItemForDisplay } from '../types';

export interface ItemsListProps<ListData extends ItemForDisplay> {
  items: ListData[];
  itemsActions: (item: ListData) => React.ReactNode;
}

export default function ItemsList<ListData extends ItemForDisplay>(
  props: ItemsListProps<ListData>,
) {
  const { items, itemsActions } = props;

  const containerClassName = 'flex w-full flex-col gap-2';

  const cardActions = (item: ListData) => <div className="flex gap-8">{itemsActions(item)}</div>;

  if (!items.length) {
    return (
      <div className={containerClassName}>
        <div className="bg-surface border-primary-ring text-primary rounded-md border p-6 text-center text-sm">
          No items found
        </div>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      {items.map((item) => (
        <ItemCard key={item.id} {...toItemCardProps(item, cardActions(item))} />
      ))}
    </div>
  );
}
