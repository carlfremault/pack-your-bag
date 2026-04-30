'use client';

import { useEffect, useState } from 'react';
import { BsFunnel, BsSortDown, BsSortDownAlt } from 'react-icons/bs';

import {
  IconToggleOption,
  Input,
  InputIconToggle,
  InputSelect,
  InputSelectOption,
} from '@repo/react-common/input';

import classNames from 'classnames';

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

const SORT_DIRECTION_OPTIONS: IconToggleOption<CollectionFilterState['sortDirection']>[] = [
  { value: 'asc', label: 'Ascending', icon: BsSortDownAlt },
  { value: 'desc', label: 'Descending', icon: BsSortDown },
];

export function CollectionFilter({ filterState, onChange }: CollectionFilterProps) {
  const [isFilterRowOpen, setIsFilterRowOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Fallback: reset isTransitioning if onTransitionEnd never fires (rapid toggle, prefers-reduced-motion)
  useEffect(() => {
    if (!isTransitioning) return;
    const timer = setTimeout(() => setIsTransitioning(false), 350);
    return () => clearTimeout(timer);
  }, [isTransitioning]);

  const hasActiveFilters =
    filterState.type !== 'all' ||
    filterState.sortField !== 'name' ||
    filterState.sortDirection !== 'asc';

  return (
    <div className="bg-surface border-primary-ring w-full rounded-md border p-4 shadow-sm">
      <div className="flex flex-col md:flex-row md:gap-4">
        {/* Row 1: Search + Filter toggle (mobile only) */}
        <div className="flex gap-4 md:contents">
          <div className="min-w-0 flex-1">
            <Input
              label="Search"
              type="search"
              value={filterState.search}
              onChange={(e) => onChange({ search: e.target.value })}
              placeholder="Search by name or description"
            />
          </div>
          <div className="flex flex-none flex-col justify-end md:hidden">
            <div className="relative">
              <button
                type="button"
                aria-label="Toggle filters"
                aria-expanded={isFilterRowOpen}
                onClick={() => {
                  setIsTransitioning(true);
                  setIsFilterRowOpen((v) => !v);
                }}
                className={classNames(
                  'bg-surface-overlay flex cursor-pointer rounded-md p-1',
                  'transition-all duration-150 ease-out',
                  'focus-visible:ring-primary-ring focus-visible:ring-2 focus-visible:outline-none',
                  hasActiveFilters ? 'text-primary' : 'text-nav-inactive',
                )}
              >
                <span
                  className={classNames(
                    'flex items-center justify-center rounded-md p-1.5',
                    'active:bg-primary/10 active:scale-90',
                    isFilterRowOpen && 'bg-surface shadow-sm',
                  )}
                >
                  <BsFunnel className="h-5 w-5" />
                </span>
              </button>
              {hasActiveFilters && (
                <>
                  <span
                    className="bg-info absolute -top-1 -right-1 h-2 w-2 rounded-full"
                    aria-hidden
                  />
                  <span className="sr-only">(filters active)</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Type + Sort by + Sort direction */}
        {/* Mobile: animated collapsible. Desktop: transparent via md:contents */}
        <div
          className={classNames(
            'grid transition-[grid-template-rows] duration-300 ease-in-out md:contents',
            isFilterRowOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          )}
          onTransitionEnd={(e) => {
            if (e.propertyName === 'grid-template-rows') setIsTransitioning(false);
          }}
        >
          <div
            className={classNames(
              'min-h-0 md:contents',
              (!isFilterRowOpen || isTransitioning) && 'overflow-hidden',
            )}
          >
            <div className="flex flex-col gap-4 pt-4 md:contents md:pt-0">
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
              <div className="flex gap-4 md:contents">
                <div className="min-w-0 flex-1">
                  <InputSelect
                    label="Sort by"
                    options={SORT_FIELD_OPTIONS}
                    value={filterState.sortField}
                    onChange={(v) => {
                      if (v !== undefined)
                        onChange({ sortField: v as CollectionFilterState['sortField'] });
                    }}
                  />
                </div>
                <div className="self-start md:flex-none">
                  <InputIconToggle
                    label="Sort order"
                    options={SORT_DIRECTION_OPTIONS}
                    value={filterState.sortDirection}
                    onChange={(v) => {
                      if (v !== undefined)
                        onChange({ sortDirection: v as CollectionFilterState['sortDirection'] });
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
