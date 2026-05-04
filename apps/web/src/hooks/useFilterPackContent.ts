import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { PackContentFilterState } from '@/features/collection/components/PackContentFilter';
import { PackContentEntry } from '@/features/collection/components/PackContentTable';
import {
  CollectionItemForDisplay,
  CollectionListForDisplayWithItems,
} from '@/features/collection/types';
import { useRestoreSortFromSession } from '@/hooks/useRestoreSortFromSession';
import { useSearchDraft } from '@/hooks/useSearchDraft';

const PACK_SORT_FIELD_KEY = 'packContentSortField';
const PACK_SORT_DIR_KEY = 'packContentSortDir';

export function useFilterPackContent({
  items,
  lists,
}: {
  items: CollectionItemForDisplay[];
  lists: CollectionListForDisplayWithItems[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { searchDraft, handleSearchChange } = useSearchDraft();
  const sessionSort = useRestoreSortFromSession({
    sortFieldKey: PACK_SORT_FIELD_KEY,
    sortDirKey: PACK_SORT_DIR_KEY,
    defaultSortField: 'name',
  });

  const filterState: PackContentFilterState = useMemo(() => {
    const rawSort = searchParams.get('sort') ?? sessionSort.field;
    const rawDir = searchParams.get('dir') ?? sessionSort.dir;
    return {
      search: searchParams.get('search') ?? '',
      contentType: (searchParams.get('type') ?? 'all') as PackContentFilterState['contentType'],
      sortField:
        rawSort === 'type' || rawSort === 'weight' || rawSort === 'category' ? rawSort : 'name',
      sortDirection: rawDir === 'desc' ? 'desc' : 'asc',
    };
  }, [searchParams, sessionSort]);

  const displayFilterState: PackContentFilterState = { ...filterState, search: searchDraft };

  const filteredContent = useMemo((): PackContentEntry[] => {
    const { sortField, sortDirection, contentType } = filterState;
    const term = searchDraft.toLowerCase();

    const matchesSearch = (entry: { name: string; description?: string | null }) =>
      !searchDraft ||
      entry.name.toLowerCase().includes(term) ||
      (entry.description?.toLowerCase().includes(term) ?? false);

    const itemEntries: PackContentEntry[] = items
      .filter((item) => contentType !== 'list' && matchesSearch(item))
      .map((item) => ({ ...item, entryType: 'item' as const }));

    const listEntries: PackContentEntry[] = lists
      .filter((list) => contentType !== 'item' && matchesSearch(list))
      .map((list) => ({ ...list, entryType: 'list' as const }));

    const result = [...itemEntries, ...listEntries];

    result.sort((a, b) => {
      let cmp: number;
      if (sortField === 'weight') {
        const aWeight =
          a.entryType === 'item' ? (a.weight != null ? Number(a.weight) : 0) : a.totalWeight;
        const bWeight =
          b.entryType === 'item' ? (b.weight != null ? Number(b.weight) : 0) : b.totalWeight;
        cmp = aWeight - bWeight;
      } else if (sortField === 'name') {
        cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      } else if (sortField === 'category') {
        const aCat = a.entryType === 'item' ? (a.category?.name ?? '') : '';
        const bCat = b.entryType === 'item' ? (b.category?.name ?? '') : '';
        cmp = aCat.toLowerCase().localeCompare(bCat.toLowerCase());
      } else if (sortField === 'type') {
        cmp = a.entryType.localeCompare(b.entryType);
      } else {
        cmp = 0;
      }
      if (cmp === 0 && sortField !== 'name') {
        cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [items, lists, filterState, searchDraft]);

  const handleFilterChange = useCallback(
    (updates: Partial<PackContentFilterState>) => {
      if (updates.search !== undefined) {
        handleSearchChange(updates.search);
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      if (updates.contentType !== undefined) {
        if (updates.contentType) params.set('type', updates.contentType);
        else params.delete('type');
      }
      if (updates.sortField !== undefined) {
        params.set('sort', updates.sortField);
        sessionStorage.setItem(PACK_SORT_FIELD_KEY, updates.sortField);
      }
      if (updates.sortDirection !== undefined) {
        params.set('dir', updates.sortDirection);
        sessionStorage.setItem(PACK_SORT_DIR_KEY, updates.sortDirection);
      }
      router.replace(`${pathname}?${params.toString()}`);
    },
    [handleSearchChange, pathname, router, searchParams],
  );

  return { filteredContent, displayFilterState, handleFilterChange };
}
