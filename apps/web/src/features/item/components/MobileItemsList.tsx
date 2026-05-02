import { MdDeleteOutline, MdOutlineEdit } from 'react-icons/md';

import { Button } from '@repo/react-common/button';
import { ItemCard } from '@repo/react-common/card';

import { toItemCardProps } from '@/lib/mappers/item.mapper';

import { ItemForDisplay } from '../types';

import MobileItemsListSkeleton from './MobileItemsListSkeleton';

export interface MobileItemsListProps {
  items: ItemForDisplay[];
  isLoading: boolean;
  onEditItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
}

export default function MobileItemsList(props: MobileItemsListProps) {
  const { items, isLoading, onEditItem, onDeleteItem } = props;

  const containerClassName = 'flex w-full flex-col gap-2';

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

  const cardActions = (id: string, name: string) => (
    <div className="flex gap-8">
      <Button
        variant="unstyledIcon"
        color="primary"
        aria-label={`Edit ${name}`}
        onClick={() => onEditItem(id)}
      >
        <MdOutlineEdit className="h-5 w-5" aria-hidden="true" />
      </Button>
      <Button
        variant="unstyledIcon"
        color="danger"
        aria-label={`Delete ${name}`}
        onClick={() => onDeleteItem(id)}
      >
        <MdDeleteOutline className="h-5 w-5" aria-hidden="true" />
      </Button>
    </div>
  );

  return (
    <div className={containerClassName}>
      {items.map((item) => (
        <ItemCard
          key={item.id}
          {...toItemCardProps(item, cardActions(item.id, item.name))}
          className="last:mb-[25vh]"
        />
      ))}
    </div>
  );
}
