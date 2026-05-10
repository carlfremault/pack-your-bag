import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { CollectionFilterState } from '@/features/collection/components/CollectionFilter';
import { CollectionForDisplay } from '@/features/collection/types';
import { useRestoreSortFromSession } from '@/hooks/useRestoreSortFromSession';
import { useSearchDraft } from '@/hooks/useSearchDraft';

const COLLECTION_SORT_FIELD_KEY = 'collectionSortField';
const COLLECTION_SORT_DIR_KEY = 'collectionSortDir';

export function useFilterCollections({ collections }: { collections: CollectionForDisplay[] }) {
  const { searchDraft, handleSearchChange } = useSearchDraft();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sessionSort = useRestoreSortFromSession({
    sortFieldKey: COLLECTION_SORT_FIELD_KEY,
    sortDirKey: COLLECTION_SORT_DIR_KEY,
    defaultSortField: 'name',
  });

  const filterState: CollectionFilterState = useMemo(() => {
    const rawSort = searchParams.get('sort') ?? sessionSort.field;
    const rawDir = searchParams.get('dir') ?? sessionSort.dir;
    return {
      search: searchParams.get('search') ?? '',
      type: (searchParams.get('type') ?? 'all') as CollectionFilterState['type'],
      sortField: rawSort === 'type' || rawSort === 'weight' ? rawSort : 'name',
      sortDirection: rawDir === 'desc' ? 'desc' : 'asc',
    };
  }, [searchParams, sessionSort]);

  const displayFilterState: CollectionFilterState = { ...filterState, search: searchDraft };

  const filteredCollections = useMemo(() => {
    let result = [...collections];

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
    collections,
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
        params.set('sort', updates.sortField);
        sessionStorage.setItem(COLLECTION_SORT_FIELD_KEY, updates.sortField);
      }
      if (updates.sortDirection !== undefined) {
        params.set('dir', updates.sortDirection);
        sessionStorage.setItem(COLLECTION_SORT_DIR_KEY, updates.sortDirection);
      }
      router.replace(`${pathname}?${params.toString()}`);
    },
    [handleSearchChange, pathname, router, searchParams],
  );

  return { filteredCollections, displayFilterState, handleFilterChange };
}
