'use client';

import { useMemo } from 'react';
import Link from 'next/link';

import { Alert } from '@repo/react-common/alert';
import { useBreakpoint } from '@repo/react-common/hooks';
import { PageNotReady } from '@repo/react-common/utils';

import { usePreferences } from '@/features/settings/queries';
import { useActionQuery } from '@/hooks/useActionQuery';
import { useFilterCollections } from '@/hooks/useFilterCollections';
import { formatWeightForDisplay } from '@/utils/weightUtils';

import { useAllCollections } from '../queries';
import { CollectionForDisplay } from '../types';

import { CollectionFilter } from './CollectionFilter';
import CollectionsList from './CollectionsList';

export default function CollectionsView() {
  const { isReady, isDesktop } = useBreakpoint();
  const actionQuery = useActionQuery();

  const {
    data: collections = [],
    isLoading: isCollectionsLoading,
    isError: isCollectionsError,
  } = useAllCollections();
  const { data: preferences, isLoading: isPreferencesLoading } = usePreferences();
  const isLoading = isCollectionsLoading || isPreferencesLoading;

  const collectionsForDisplay: CollectionForDisplay[] = useMemo(() => {
    return collections.map((collection) => {
      const { value, unit } = formatWeightForDisplay(collection.totalWeight, preferences?.units);
      return { ...collection, displayWeight: value, displayUnit: unit };
    });
  }, [collections, preferences?.units]);

  const { filteredCollections, displayFilterState, handleFilterChange } = useFilterCollections({
    collections: collectionsForDisplay,
  });

  if (!isReady) {
    return <PageNotReady />;
  }

  if (isCollectionsError && !collections.length) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <Alert type="error" message="Failed to load collections. Please try again later." />
      </div>
    );
  }

  if (!isDesktop) {
    return (
      <div className="mb-32 flex w-full max-w-3xl flex-col gap-4 p-4 lg:p-8">
        <CollectionFilter filterState={displayFilterState} onChange={handleFilterChange} />
        <CollectionsList
          collections={filteredCollections}
          isLoading={isLoading}
          linkAs={Link}
          actionQuery={actionQuery}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col gap-4 p-4">
      <CollectionFilter filterState={displayFilterState} onChange={handleFilterChange} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <CollectionsList
          collections={filteredCollections}
          isLoading={isLoading}
          linkAs={Link}
          actionQuery={actionQuery}
        />
      </div>
    </div>
  );
}
