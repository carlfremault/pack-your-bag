'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useBreakpoint } from '@repo/react-common/hooks';
import { Spinner } from '@repo/react-common/spinner';

import { usePreferences } from '@/features/settings/queries';
import { useRestoreSortFromSession } from '@/hooks/useRestoreSortFromSession';
import { useSearchDraft } from '@/hooks/useSearchDraft';
import { formatWeightForDisplay } from '@/utils/weightUtils';

import { useAllCollections } from '../queries';
import { CollectionForDisplay } from '../types';

import { CollectionFilter, CollectionFilterState } from './CollectionFilter';
import CollectionsList from './CollectionsList';

export default function CollectionsView() {
  const { isReady, isDesktop } = useBreakpoint();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { searchDraft, handleSearchChange } = useSearchDraft();
  useRestoreSortFromSession({
    sortFieldKey: 'collectionSortField',
    sortDirKey: 'collectionSortDir',
    defaultSortField: 'name',
  });

  const { data: collections = [], isLoading: isCollectionsLoading } = useAllCollections();
  const { data: preferences, isLoading: isPreferencesLoading } = usePreferences();
  const isLoading = isCollectionsLoading || isPreferencesLoading;

  const collectionsForDisplay: CollectionForDisplay[] = useMemo(() => {
    return collections.map((collection) => {
      const { value, unit } = formatWeightForDisplay(collection.totalWeight, preferences?.units);
      return { ...collection, displayWeight: value, displayUnit: unit };
    });
  }, [collections, preferences?.units]);

  const filterState: CollectionFilterState = useMemo(() => {
    const rawSort = searchParams.get('sort');
    const rawDir = searchParams.get('dir');
    return {
      search: searchParams.get('search') ?? '',
      type: (searchParams.get('type') ?? 'all') as CollectionFilterState['type'],
      sortField: rawSort === 'type' || rawSort === 'weight' ? rawSort : 'name',
      sortDirection: rawDir === 'desc' ? 'desc' : 'asc',
    };
  }, [searchParams]);

  const displayFilterState: CollectionFilterState = { ...filterState, search: searchDraft };

  const filteredCollections = useMemo(() => {
    let result = [...collectionsForDisplay];

    if (searchDraft) {
      const term = searchDraft.toLowerCase();
      result = result.filter(
        (collection) =>
          collection.name.toLowerCase().includes(term) ||
          (collection.description?.toLowerCase().includes(term) ?? false),
      );
    }

    if (filterState.type && filterState.type !== 'all') {
      result = result.filter((collection) => collection.type === filterState.type);
    }

    result.sort((a, b) => {
      let cmp: number;
      if (filterState.sortField === 'name') {
        cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      } else if (filterState.sortField === 'type') {
        cmp = a.type.localeCompare(b.type);
      } else if (filterState.sortField === 'weight') {
        cmp = a.totalWeight - b.totalWeight;
      } else {
        cmp = 0;
      }
      if (cmp === 0 && filterState.sortField !== 'name') {
        cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      }
      return filterState.sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [
    collectionsForDisplay,
    searchDraft,
    filterState.type,
    filterState.sortField,
    filterState.sortDirection,
  ]);

  const handleFilterChange = useCallback(
    (updates: Partial<CollectionFilterState>) => {
      if (updates.search !== undefined) {
        handleSearchChange(updates.search);
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      if (updates.type !== undefined) {
        if (updates.type) params.set('type', updates.type);
        else params.delete('type');
      }
      if (updates.sortField !== undefined) {
        if (updates.sortField !== 'name') params.set('sort', updates.sortField);
        else params.delete('sort');
        sessionStorage.setItem('collectionSortField', updates.sortField);
      }
      if (updates.sortDirection !== undefined) {
        if (updates.sortDirection !== 'asc') params.set('dir', updates.sortDirection);
        else params.delete('dir');
        sessionStorage.setItem('collectionSortDir', updates.sortDirection);
      }
      router.replace(`${pathname}?${params.toString()}`);
    },
    [handleSearchChange, pathname, router, searchParams],
  );

  if (!isReady) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  if (!isDesktop) {
    return (
      <div className="flex w-full max-w-3xl flex-col gap-4 p-4 lg:p-8">
        <CollectionFilter filterState={displayFilterState} onChange={handleFilterChange} />
        <CollectionsList
          collections={filteredCollections}
          isLoading={isLoading}
          onOpenCollection={() => {}}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col gap-4 p-4">
      <CollectionFilter filterState={displayFilterState} onChange={handleFilterChange} />
      <div className="min-h-0 flex-1">
        <CollectionsList
          collections={filteredCollections}
          isLoading={isLoading}
          onOpenCollection={() => {}}
        />
      </div>
    </div>
  );
}
