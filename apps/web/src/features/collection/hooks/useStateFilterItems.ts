'use client';

import { useCallback, useMemo, useState } from 'react';

import { ItemFilterState } from '@/features/item/components/ItemFilter';

type FilterableItem = {
  name: string;
  description?: string | null;
  weight?: string | number | null;
  category?: { name: string } | null;
};

export function useStateFilterItems<T extends FilterableItem>({ items }: { items: T[] }) {
  const [filterState, setFilterState] = useState<ItemFilterState>({
    search: '',
    category: '',
    sortField: 'name',
    sortDirection: 'asc',
  });

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (filterState.search) {
      const term = filterState.search.toLowerCase();
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
      } else if (filterState.sortField === 'category') {
        cmp = (a.category?.name ?? '')
          .toLowerCase()
          .localeCompare((b.category?.name ?? '').toLowerCase());
      } else {
        cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      }
      if (cmp === 0 && filterState.sortField !== 'name') {
        cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      }
      return filterState.sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [items, filterState]);

  const handleFilterChange = useCallback((updates: Partial<ItemFilterState>) => {
    setFilterState((prev) => ({ ...prev, ...updates }));
  }, []);

  return { filteredItems, displayFilterState: filterState, handleFilterChange };
}
