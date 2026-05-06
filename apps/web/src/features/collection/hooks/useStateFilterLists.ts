'use client';

import { useCallback, useMemo, useState } from 'react';

import { ListFilterState } from '@/features/collection/components/ListFilter';

type FilterableList = {
  name: string;
  description?: string | null;
  totalWeight?: string | number | null;
};

export function useStateFilterLists<T extends FilterableList>({ lists }: { lists: T[] }) {
  const [filterState, setFilterState] = useState<ListFilterState>({
    search: '',
    sortField: 'name',
    sortDirection: 'asc',
  });

  const filteredLists = useMemo(() => {
    let result = [...lists];

    if (filterState.search) {
      const term = filterState.search.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          (item.description?.toLowerCase().includes(term) ?? false),
      );
    }

    result.sort((a, b) => {
      let cmp: number;
      if (filterState.sortField === 'weight') {
        cmp =
          (a.totalWeight != null ? Number(a.totalWeight) : 0) -
          (b.totalWeight != null ? Number(b.totalWeight) : 0);
      } else {
        cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      }
      if (cmp === 0 && filterState.sortField !== 'name') {
        cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      }
      return filterState.sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [lists, filterState]);

  const handleFilterChange = useCallback((updates: Partial<ListFilterState>) => {
    setFilterState((prev) => ({ ...prev, ...updates }));
  }, []);

  return { filteredLists, displayFilterState: filterState, handleFilterChange };
}
