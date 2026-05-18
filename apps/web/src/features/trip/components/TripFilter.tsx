'use client';

import { InputDateRange, InputSelectOption } from '@repo/react-common/input';

import { FilterWrapper } from '@/components/FilterWrapper';

export interface TripFilterState {
  search: string;
  dateFrom?: string;
  dateUntil?: string;
  sortField: 'name' | 'date';
  sortDirection: 'asc' | 'desc';
}

interface TripFilterProps {
  filterState: TripFilterState;
  onChange: (updates: Partial<TripFilterState>) => void;
}

const SORT_FIELD_OPTIONS: InputSelectOption[] = [
  { value: 'name', label: 'Name' },
  { value: 'date', label: 'Date' },
];

export function TripFilter({ filterState, onChange }: TripFilterProps) {
  const hasActiveFilters =
    filterState.dateFrom !== undefined ||
    filterState.dateUntil !== undefined ||
    filterState.sortField !== 'name' ||
    filterState.sortDirection !== 'asc';

  return (
    <FilterWrapper
      search={filterState.search}
      onSearchChange={(v) => onChange({ search: v })}
      hasActiveFilters={hasActiveFilters}
      sortField={filterState.sortField}
      sortFieldOptions={SORT_FIELD_OPTIONS}
      onSortFieldChange={(v) => onChange({ sortField: v as TripFilterState['sortField'] })}
      sortDirection={filterState.sortDirection}
      onSortDirectionChange={(v) => onChange({ sortDirection: v })}
    >
      <InputDateRange
        dateFrom={filterState.dateFrom}
        dateUntil={filterState.dateUntil}
        onChange={(v) => onChange(v)}
      />
    </FilterWrapper>
  );
}
