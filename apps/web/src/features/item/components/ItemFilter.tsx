'use client';

import { useMemo } from 'react';

import { InputSelect, InputSelectOption } from '@repo/react-common/input';
import { CategoryPill, CategoryPillProps } from '@repo/react-common/pill';

import { FilterWrapper } from '@/components/FilterWrapper';
import { useAllCategories } from '@/features/category/queries';
import { toCategoryPillProps } from '@/lib/mappers/category.mapper';

const SORT_FIELD_OPTIONS: InputSelectOption[] = [
  { value: 'name', label: 'Name' },
  { value: 'weight', label: 'Weight' },
  { value: 'category', label: 'Category' },
];

export interface ItemFilterState {
  search: string;
  category: string;
  sortField: 'name' | 'weight' | 'category';
  sortDirection: 'asc' | 'desc';
}

export interface ItemFilterProps {
  filterState: ItemFilterState;
  onChange: (updates: Partial<ItemFilterState>) => void;
  collectionCategories?: CategoryPillProps[];
}

export default function ItemFilter(props: ItemFilterProps) {
  const { filterState, onChange, collectionCategories } = props;
  const { data: categories } = useAllCategories();

  const hasActiveFilters =
    filterState.category !== '' ||
    filterState.sortField !== 'name' ||
    filterState.sortDirection !== 'asc';

  const categoryOptions = useMemo<InputSelectOption[]>(() => {
    const categoriesAllowed = collectionCategories
      ? new Set(collectionCategories.map((c) => c.name))
      : null;

    return categories
      .filter((category) => !categoriesAllowed || categoriesAllowed.has(category.name))
      .map((category) => ({
        value: category.name,
        label: <CategoryPill {...toCategoryPillProps(category)} />,
      }));
  }, [categories, collectionCategories]);

  const placeholder =
    categories.length === 0
      ? 'No categories yet'
      : categoryOptions.length === 0
        ? 'No categories'
        : 'All categories';

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
          placeholder={placeholder}
          disabled={categoryOptions.length === 0}
        />
      </div>
    </FilterWrapper>
  );
}
