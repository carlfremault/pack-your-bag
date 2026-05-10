'use client';

import { useMemo } from 'react';
import Link from 'next/link';

import { usePreferences } from '@/features/settings/queries';
import { formatWeightForDisplay } from '@/utils/weightUtils';

import { useFilterCollections } from '../hooks/useFilterCollections';
import { useAllCollections } from '../queries';
import { CollectionForDisplay } from '../types';

import { CollectionFilter } from './CollectionFilter';
import CollectionsList from './CollectionsList';

export default function CollectionsView() {
  const { data: collections } = useAllCollections();
  const { data: preferences } = usePreferences();

  const collectionsForDisplay: CollectionForDisplay[] = useMemo(() => {
    return collections.map((collection) => {
      const { value, unit } = formatWeightForDisplay(collection.totalWeight, preferences?.units);
      return { ...collection, displayWeight: value, displayUnit: unit };
    });
  }, [collections, preferences?.units]);

  const { filteredCollections, displayFilterState, handleFilterChange } = useFilterCollections({
    collections: collectionsForDisplay,
  });

  return (
    <>
      {/* Mobile */}
      <div className="mb-32 flex w-full max-w-3xl flex-col gap-4 p-4 lg:hidden lg:p-8">
        <CollectionFilter filterState={displayFilterState} onChange={handleFilterChange} />
        <CollectionsList collections={filteredCollections} linkAs={Link} />
      </div>
      {/* Desktop */}
      <div className="hidden h-full w-full flex-col gap-4 p-4 lg:flex">
        <CollectionFilter filterState={displayFilterState} onChange={handleFilterChange} />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <CollectionsList collections={filteredCollections} linkAs={Link} />
        </div>
      </div>
    </>
  );
}
