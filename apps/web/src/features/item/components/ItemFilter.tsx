'use client';

import { useMemo } from 'react';

import { InputSelect, InputSelectOption } from '@repo/react-common/input';
import { CategoryPill } from '@repo/react-common/pill';

import { FilterWrapper } from '@/components/FilterWrapper';
import { useAllCategories } from '@/features/category/queries';
import { toCategoryPillProps } from '@/lib/mappers/category.mapper';

export interface ItemFilterState {
  search: string;
  category: string;
  sortField: 'name' | 'weight' | 'category';
  sortDirection: 'asc' | 'desc';
}

interface ItemFilterProps {
  filterState: ItemFilterState;
  onChange: (updates: Partial<ItemFilterState>) => void;
}

const SORT_FIELD_OPTIONS: InputSelectOption[] = [
  { value: 'name', label: 'Name' },
  { value: 'weight', label: 'Weight' },
  { value: 'category', label: 'Category' },
];

export function ItemFilter({ filterState, onChange }: ItemFilterProps) {
  const { data: categories } = useAllCategories();

  const hasActiveFilters =
    filterState.category !== '' ||
    filterState.sortField !== 'name' ||
    filterState.sortDirection !== 'asc';

  const categoryOptions = useMemo<InputSelectOption[]>(
    () =>
      categories.map((category) => ({
        value: category.name,
        label: <CategoryPill {...toCategoryPillProps(category)} />,
      })),
    [categories],
  );

  return (
    <FilterWrapper
      search={filterState.search}
      onSearchChange={(v) => onChange({ search: v })}
      hasActiveFilters={hasActiveFilters}
      sortField={filterState.sortField}
      sortFieldOptions={SORT_FIELD_OPTIONS}
      onSortFieldChange={(v) => onChange({ sortField: v as ItemFilterState['sortField'] })}
      sortDirection={filterState.sortDirection}
      onSortDirectionChange={(v) => onChange({ sortDirection: v })}
    >
      <div className="min-w-0 flex-1">
        <InputSelect
          label="Category"
          isClearable
          options={categoryOptions}
          value={filterState.category}
          onChange={(v) => onChange({ category: v })}
          placeholder={categories.length === 0 ? 'No categories yet' : 'All categories'}
          disabled={categories.length === 0}
        />
      </div>
    </FilterWrapper>
  );
}
