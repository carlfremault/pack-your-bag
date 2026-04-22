'use client';

import { useMemo } from 'react';
import { MdArrowDownward, MdArrowUpward } from 'react-icons/md';

import {
  IconToggleOption,
  Input,
  InputIconToggle,
  InputSelect,
  InputSelectOption,
} from '@repo/react-common/input';
import { CategoryPill } from '@repo/react-common/pill';

import { useAllCategories } from '@/features/category/queries';

export interface ItemFilterState {
  search: string;
  categoryId: string;
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

const SORT_DIRECTION_OPTIONS: IconToggleOption<ItemFilterState['sortDirection']>[] = [
  { value: 'asc', label: 'Ascending', icon: MdArrowUpward },
  { value: 'desc', label: 'Descending', icon: MdArrowDownward },
];

export function ItemFilter({ filterState, onChange }: ItemFilterProps) {
  const { data: categories = [] } = useAllCategories();

  const categoryOptions = useMemo<InputSelectOption[]>(
    () =>
      categories.map((c) => ({
        value: c.id,
        label: <CategoryPill name={c.name} colorTheme={c.colorTheme} />,
      })),
    [categories],
  );

  return (
    <div className="bg-surface border-primary-ring w-full rounded-md border p-4 shadow-sm">
      <div className="flex flex-wrap gap-4">
        <div className="min-w-[180px] flex-1">
          <Input
            label="Search"
            type="search"
            value={filterState.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Search by name or description"
          />
        </div>
        <div className="min-w-[160px] flex-1">
          <InputSelect
            label="Category"
            isClearable
            options={categoryOptions}
            value={filterState.categoryId}
            onChange={(v) => onChange({ categoryId: v })}
            placeholder="All categories"
          />
        </div>
        <div className="min-w-[140px] flex-1">
          <InputSelect
            label="Sort by"
            options={SORT_FIELD_OPTIONS}
            value={filterState.sortField}
            onChange={(v) => {
              if (v) onChange({ sortField: v as ItemFilterState['sortField'] });
            }}
          />
        </div>
        <div className="flex flex-0">
          <InputIconToggle
            label="Order"
            options={SORT_DIRECTION_OPTIONS}
            value={filterState.sortDirection}
            onChange={(v) => onChange({ sortDirection: v })}
          />
        </div>
      </div>
    </div>
  );
}
