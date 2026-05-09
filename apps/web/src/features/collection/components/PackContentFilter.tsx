'use client';

import { IoShirtOutline } from 'react-icons/io5';
import { MdOutlineFormatListBulleted, MdOutlineShoppingBag } from 'react-icons/md';

import { InputSelect, InputSelectOption } from '@repo/react-common/input';

import { FilterWrapper } from '@/components/FilterWrapper';

export interface PackContentFilterState {
  search: string;
  contentType: 'all' | 'item' | 'list';
  sortField: 'name' | 'type' | 'weight' | 'category';
  sortDirection: 'asc' | 'desc';
}

const CONTENT_TYPE_OPTIONS: InputSelectOption<'all' | 'item' | 'list'>[] = [
  {
    value: 'all',
    label: (
      <div className="flex items-center gap-1">
        <MdOutlineShoppingBag className="h-4 w-4" aria-hidden="true" />
        <span>Items & Lists</span>
      </div>
    ),
  },
  {
    value: 'item',
    label: (
      <div className="flex items-center gap-1">
        <IoShirtOutline className="h-4 w-4" aria-hidden="true" />
        <span>Items</span>
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
];

const SORT_FIELD_OPTIONS: InputSelectOption[] = [
  { value: 'name', label: 'Name' },
  { value: 'type', label: 'Type' },
  { value: 'weight', label: 'Weight' },
  { value: 'category', label: 'Category' },
];

export interface PackContentFilterProps {
  filterState: PackContentFilterState;
  onChange: (updates: Partial<PackContentFilterState>) => void;
}

export function PackContentFilter({ filterState, onChange }: PackContentFilterProps) {
  const hasActiveFilters =
    filterState.contentType !== 'all' ||
    filterState.sortField !== 'name' ||
    filterState.sortDirection !== 'asc';

  return (
    <FilterWrapper
      search={filterState.search}
      onSearchChange={(v) => onChange({ search: v })}
      hasActiveFilters={hasActiveFilters}
      sortField={filterState.sortField}
      sortFieldOptions={SORT_FIELD_OPTIONS}
      onSortFieldChange={(v) => onChange({ sortField: v as PackContentFilterState['sortField'] })}
      sortDirection={filterState.sortDirection}
      onSortDirectionChange={(v) => onChange({ sortDirection: v })}
    >
      <div className="min-w-0 flex-1">
        <InputSelect
          label="Type"
          isClearable
          clearValue="all"
          options={CONTENT_TYPE_OPTIONS}
          value={filterState.contentType}
          onChange={(v) => onChange({ contentType: v as PackContentFilterState['contentType'] })}
        />
      </div>
    </FilterWrapper>
  );
}
