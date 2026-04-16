import { ItemCard } from '@repo/react-common/card';

import { toItemCardProps } from '@/lib/mappers/item.mapper';

import { Item } from '../types';

import MobileItemsListSkeleton from './MobileItemsListSkeleton';

export interface MobileItemsListProps {
  items: Item[];
  onEditItem: (id: string) => void;
  isLoading: boolean;
}

export default function MobileItemsList(props: MobileItemsListProps) {
  const { items, onEditItem, isLoading } = props;

  const containerClassName = 'flex w-full max-w-3xl flex-col gap-2 p-2 sm:p-4';

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
        <ItemCard key={item.id} {...toItemCardProps(item, { onEditItem })} />
      ))}
    </div>
  );
}
