import { CollectionCard } from '@repo/react-common/card';

import { toCollectionCardProps } from '@/lib/mappers/collection.mapper';

import { CollectionForDisplay } from '../types';

import CollectionsListSkeleton from './CollectionsListSkeleton';

export interface MobileCollectionsListProps {
  collections: CollectionForDisplay[];
  isLoading: boolean;
  onOpenCollection?: (id: string) => void;
}

export default function CollectionsList(props: MobileCollectionsListProps) {
  const { collections, isLoading, onOpenCollection = () => {} } = props;

  const containerClassName = 'grid w-full gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';

  if (isLoading) {
    return (
      <div className={containerClassName} aria-busy="true" aria-label="Loading collections">
        <CollectionsListSkeleton />
      </div>
    );
  }

  if (!collections.length) {
    return (
      <div className={containerClassName}>
        <div className="bg-surface border-primary-ring text-primary col-span-full rounded-md border p-6 text-center text-sm">
          No collections found
        </div>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      {collections.map((collection) => (
        <CollectionCard
          key={collection.id}
          {...toCollectionCardProps(collection, { onOpenCollection })}
        />
      ))}
    </div>
  );
}
