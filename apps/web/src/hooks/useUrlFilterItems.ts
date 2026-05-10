import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { ItemFilterState } from '@/features/item/components/ItemFilter';
import { useRestoreSortFromSession } from '@/hooks/useRestoreSortFromSession';
import { useSearchDraft } from '@/hooks/useSearchDraft';

type FilterableItem = {
  name: string;
  description?: string | null;
  weight?: string | number | null;
  category?: { name: string } | null;
};

export function useUrlFilterItems<T extends FilterableItem>({
  items,
  sortFieldKey,
  sortDirKey,
}: {
  items: T[];
  sortFieldKey: string;
  sortDirKey: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { searchDraft, handleSearchChange } = useSearchDraft();
  const sessionSort = useRestoreSortFromSession({
    sortFieldKey,
    sortDirKey,
    defaultSortField: 'name',
  });

  const filterState: ItemFilterState = useMemo(() => {
    const rawSort = searchParams.get('sort') ?? sessionSort.field;
    const rawDir = searchParams.get('dir') ?? sessionSort.dir;
    return {
      search: searchParams.get('search') ?? '',
      category: searchParams.get('category') ?? '',
      sortField: rawSort === 'weight' || rawSort === 'category' ? rawSort : 'name',
      sortDirection: rawDir === 'desc' ? 'desc' : 'asc',
    };
  }, [searchParams, sessionSort]);

  const displayFilterState: ItemFilterState = { ...filterState, search: searchDraft };

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (searchDraft) {
      const term = searchDraft.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          (item.description?.toLowerCase().includes(term) ?? false),
      );
    }

    if (filterState.category) {
      result = result.filter((item) => item.category?.name === filterState.category);
    }

    result.sort((a, b) => {
      let cmp: number;
      if (filterState.sortField === 'weight') {
        cmp = (a.weight != null ? Number(a.weight) : 0) - (b.weight != null ? Number(b.weight) : 0);
      } else if (filterState.sortField === 'name') {
        cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      } else if (filterState.sortField === 'category') {
        cmp = (a.category?.name ?? '')
          .toLowerCase()
          .localeCompare((b.category?.name ?? '').toLowerCase());
      } else {
        cmp = 0;
      }
      if (cmp === 0 && filterState.sortField !== 'name') {
        cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      }
      return filterState.sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [items, searchDraft, filterState.category, filterState.sortField, filterState.sortDirection]);

  const handleFilterChange = useCallback(
    (updates: Partial<ItemFilterState>) => {
      if (updates.search !== undefined) {
        handleSearchChange(updates.search);
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      if (updates.category !== undefined) {
        if (updates.category) params.set('category', updates.category);
        else params.delete('category');
      }
      if (updates.sortField !== undefined) {
        params.set('sort', updates.sortField);
        sessionStorage.setItem(sortFieldKey, updates.sortField);
      }
      if (updates.sortDirection !== undefined) {
        params.set('dir', updates.sortDirection);
        sessionStorage.setItem(sortDirKey, updates.sortDirection);
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [handleSearchChange, pathname, router, searchParams, sortFieldKey, sortDirKey],
  );

  return { filteredItems, displayFilterState, handleFilterChange };
}
