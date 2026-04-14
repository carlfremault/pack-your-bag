import { ReactNode } from 'react';

import { Alert } from '@repo/react-common/alert';
import { ItemCard } from '@repo/react-common/card';

import { toItemCardProps } from '@/lib/mappers/item.mapper';

import { Item } from '../types';

import MobileItemsListSkeleton from './MobileItemsListSkeleton';

export interface MobileItemsListProps {
  items: Item[];
  onEditItem: (id: string) => void;
  isFetching: boolean;
  errorMessage: string | null;
}

export default function MobileItemsList(props: MobileItemsListProps) {
  const { items, onEditItem, isFetching, errorMessage } = props;

  let content: ReactNode;

  if (!errorMessage) {
    if (isFetching) {
      content = <MobileItemsListSkeleton />;
    } else if (!items.length) {
      content = (
        <div className="bg-surface border-primary-ring text-primary rounded-md border p-6 text-center text-sm">
          No items found
        </div>
      );
    } else {
      content = items.map((item) => (
        <ItemCard key={item.id} {...toItemCardProps(item, { onEditItem })} />
      ));
    }
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-2 p-2 sm:p-4">
      {errorMessage && <Alert message={errorMessage} type="error" />}
      {content}
    </div>
  );
}
