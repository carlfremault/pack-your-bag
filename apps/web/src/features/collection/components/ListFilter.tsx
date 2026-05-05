'use client';

import { InputSelectOption } from '@repo/react-common/input';

import { FilterWrapper } from '@/components/FilterWrapper';

export interface ListFilterState {
  search: string;
  sortField: 'name' | 'weight';
  sortDirection: 'asc' | 'desc';
}

interface ListFilterProps {
  filterState: ListFilterState;
  onChange: (updates: Partial<ListFilterState>) => void;
}

const SORT_FIELD_OPTIONS: InputSelectOption[] = [
  { value: 'name', label: 'Name' },
  { value: 'weight', label: 'Weight' },
];

export function ListFilter({ filterState, onChange }: ListFilterProps) {
  const hasActiveFilters = filterState.sortField !== 'name' || filterState.sortDirection !== 'asc';

  return (
    <FilterWrapper
      search={filterState.search}
      onSearchChange={(v) => onChange({ search: v })}
      hasActiveFilters={hasActiveFilters}
      sortField={filterState.sortField}
      sortFieldOptions={SORT_FIELD_OPTIONS}
      onSortFieldChange={(v) => onChange({ sortField: v as ListFilterState['sortField'] })}
      sortDirection={filterState.sortDirection}
      onSortDirectionChange={(v) => onChange({ sortDirection: v })}
    />
  );
}
