'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useBreakpoint } from '@repo/react-common/hooks';
import { Spinner } from '@repo/react-common/spinner';

import { usePreferences } from '@/features/settings/queries';
import { formatWeightForDisplay } from '@/utils/weightUtils';

import { useAllCollections } from '../queries';
import { CollectionForDisplay } from '../types';

import { CollectionFilter, CollectionFilterState } from './CollectionFilter';
import CollectionsList from './CollectionsList';

const SEARCH_DEBOUNCE_MS = 300;

export default function CollectionsView() {
  const { isReady, isDesktop } = useBreakpoint();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data: collections = [], isLoading: isCollectionsLoading } = useAllCollections();
  const { data: preferences, isLoading: isPreferencesLoading } = usePreferences();
  const isLoading = isCollectionsLoading || isPreferencesLoading;

  // searchDraft gives immediate input feedback; URL is updated with debounce
  const [searchDraft, setSearchDraft] = useState(() => searchParams.get('search') ?? '');
  const searchDraftRef = useRef(searchDraft);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On mount: if URL has no sort params, restore last saved sort from sessionStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('sort') || params.get('dir')) return;
    const savedSort = sessionStorage.getItem('collectionSortField');
    const savedDir = sessionStorage.getItem('collectionSortDir');
    if (!savedSort && !savedDir) return;
    if (savedSort && savedSort !== 'name') params.set('sort', savedSort);
    if (savedDir && savedDir !== 'asc') params.set('dir', savedDir);
    const qs = params.toString();
    if (qs) router.replace(`${pathname}?${qs}`);
  }, [pathname, router]);

  // Sync searchDraft on browser back/forward (popstate) so the input matches the restored URL
  useEffect(() => {
    const handlePopState = () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = null;
      }
      const urlSearch = new URLSearchParams(window.location.search).get('search') ?? '';
      searchDraftRef.current = urlSearch;
      setSearchDraft(urlSearch);
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = null;
      }
    };
  }, []);

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
        searchDraftRef.current = updates.search;
        setSearchDraft(updates.search);
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => {
          // Read fresh params at fire time to avoid overwriting concurrent filter changes
          const params = new URLSearchParams(window.location.search);
          if (searchDraftRef.current) {
            params.set('search', searchDraftRef.current);
          } else {
            params.delete('search');
          }
          router.replace(`${pathname}?${params.toString()}`);
        }, SEARCH_DEBOUNCE_MS);
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
    [pathname, router, searchParams],
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
