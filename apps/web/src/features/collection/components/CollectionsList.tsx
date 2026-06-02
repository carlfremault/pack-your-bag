import { CollectionCard } from '@repo/react-common/card';

import { toCollectionCardProps } from '@/lib/mappers/collection.mapper';

import { CollectionForDisplay } from '../types';

export interface CollectionsListProps {
  collections: CollectionForDisplay[];
  linkAs: React.ElementType;
  noResults: React.ReactNode;
}

export default function CollectionsList(props: CollectionsListProps) {
  const { collections, linkAs, noResults } = props;

  const containerClassName = 'grid w-full gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';

  if (!collections.length) {
    return (
      <div className={containerClassName}>
        <div className="bg-surface border-primary-ring text-primary col-span-full rounded-md border p-6 text-center text-sm">
          {noResults}
        </div>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      {collections.map((collection) => (
        <CollectionCard key={collection.id} {...toCollectionCardProps(collection, linkAs)} />
      ))}
    </div>
  );
}
