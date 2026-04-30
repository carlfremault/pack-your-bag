'use client';

import { InputSelect, InputSelectOption } from '@repo/react-common/input';

import { FilterWrapper } from '@/components/FilterWrapper';

export interface CollectionFilterState {
  search: string;
  type: 'list' | 'pack' | 'all';
  sortField: 'name' | 'type' | 'weight';
  sortDirection: 'asc' | 'desc';
}

interface CollectionFilterProps {
  filterState: CollectionFilterState;
  onChange: (updates: Partial<CollectionFilterState>) => void;
}

const TYPE_OPTIONS: InputSelectOption[] = [
  { value: 'list', label: 'Lists' },
  { value: 'pack', label: 'Packs' },
  { value: 'all', label: 'Lists & Packs' },
];

const SORT_FIELD_OPTIONS: InputSelectOption[] = [
  { value: 'name', label: 'Name' },
  { value: 'type', label: 'Type' },
  { value: 'weight', label: 'Weight' },
];

export function CollectionFilter({ filterState, onChange }: CollectionFilterProps) {
  const hasActiveFilters =
    filterState.type !== 'all' ||
    filterState.sortField !== 'name' ||
    filterState.sortDirection !== 'asc';

  return (
    <FilterWrapper
      search={filterState.search}
      onSearchChange={(v) => onChange({ search: v })}
      hasActiveFilters={hasActiveFilters}
      sortField={filterState.sortField}
      sortFieldOptions={SORT_FIELD_OPTIONS}
      onSortFieldChange={(v) => onChange({ sortField: v as CollectionFilterState['sortField'] })}
      sortDirection={filterState.sortDirection}
      onSortDirectionChange={(v) => onChange({ sortDirection: v })}
    >
      <div className="min-w-0 flex-1">
        <InputSelect
          label="Type"
          isClearable
          clearValue="all"
          options={TYPE_OPTIONS}
          value={filterState.type}
          onChange={(v) => onChange({ type: v as CollectionFilterState['type'] })}
        />
      </div>
    </FilterWrapper>
  );
}
