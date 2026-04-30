'use client';
import { BsBackpack } from 'react-icons/bs';
import { MdOutlineFormatListBulleted, MdOutlineShoppingBag } from 'react-icons/md';

import { InputSelect, InputSelectOption } from '@repo/react-common/input';

import { FilterWrapper } from '@/components/FilterWrapper';

import { CollectionType } from '../types';

export interface CollectionFilterState {
  search: string;
  type: CollectionType | 'all';
  sortField: 'name' | 'type' | 'weight';
  sortDirection: 'asc' | 'desc';
}

interface CollectionFilterProps {
  filterState: CollectionFilterState;
  onChange: (updates: Partial<CollectionFilterState>) => void;
}

const TYPE_OPTIONS: InputSelectOption<CollectionType | 'all'>[] = [
  {
    value: 'all',
    label: (
      <div className="flex items-center gap-1">
        <MdOutlineShoppingBag className="h-4 w-4" aria-hidden="true" />
        <span>Lists & Packs</span>
      </div>
    ),
  },
  {
    value: 'list',
    label: (
      <div className="flex items-center gap-1">
        <MdOutlineFormatListBulleted className="h-4 w-4" aria-hidden="true" />
        <span>Lists</span>
      </div>
    ),
  },
  {
    value: 'pack',
    label: (
      <div className="flex items-center gap-1">
        <BsBackpack className="h-4 w-4" aria-hidden="true" />
        <span>Packs</span>
      </div>
    ),
  },
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
