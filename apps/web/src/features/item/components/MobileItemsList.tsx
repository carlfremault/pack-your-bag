import { ItemCard } from '@repo/react-common/card';

import { toItemCardProps } from '@/lib/mappers/item.mapper';

import { Item } from '../types';

import MobileItemsListSkeleton from './MobileItemsListSkeleton';

export interface MobileItemsListProps {
  items: Item[];
  isLoading: boolean;
  onEditItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
}

export default function MobileItemsList(props: MobileItemsListProps) {
  const { items, onEditItem, onDeleteItem, isLoading } = props;

  const containerClassName = 'flex w-full max-w-3xl flex-col gap-2 p-2 sm:p-4 mb-[33%]';

  if (isLoading) {
    return (
      <div className={containerClassName}>
        <MobileItemsListSkeleton />
      </div>
    );
  }

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
        <ItemCard key={item.id} {...toItemCardProps(item, { onEditItem, onDeleteItem })} />
      ))}
    </div>
  );
}
