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

interface FilterWrapperProps {
  search: string;
  onSearchChange: (value: string) => void;
  hasActiveFilters: boolean;
  sortField: string;
  sortFieldOptions: InputSelectOption[];
  onSortFieldChange: (value: string) => void;
  sortDirection: 'asc' | 'desc';
  onSortDirectionChange: (value: 'asc' | 'desc') => void;
  children?: React.ReactNode;
}

const SORT_DIRECTION_OPTIONS: IconToggleOption<'asc' | 'desc'>[] = [
  { value: 'asc', label: 'Ascending', icon: BsSortDownAlt },
  { value: 'desc', label: 'Descending', icon: BsSortDown },
];

export function FilterWrapper({
  search,
  onSearchChange,
  hasActiveFilters,
  sortField,
  sortFieldOptions,
  onSortFieldChange,
  sortDirection,
  onSortDirectionChange,
  children,
}: FilterWrapperProps) {
  const [isFilterRowOpen, setIsFilterRowOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Fallback: reset isTransitioning if onTransitionEnd never fires (rapid toggle, prefers-reduced-motion)
  useEffect(() => {
    if (!isTransitioning) return;
    const timer = setTimeout(() => setIsTransitioning(false), 350);
    return () => clearTimeout(timer);
  }, [isTransitioning]);

  return (
    <div className="bg-surface border-primary-ring w-full rounded-md border p-4 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:gap-4">
        {/* Row 1: Search + Filter toggle (mobile only) */}
        <div className="flex gap-4 lg:contents">
          <div className="min-w-0 flex-1">
            <Input
              label="Search"
              type="search"
              autoComplete="off"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name or description"
            />
          </div>
          <div className="flex flex-none flex-col justify-end lg:hidden">
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

        {/* Row 2: Feature filter slot + Sort by + Sort direction */}
        {/* Mobile: animated collapsible. Desktop: transparent via lg:contents */}
        <div
          className={classNames(
            'grid transition-[grid-template-rows] duration-300 ease-in-out lg:contents',
            isFilterRowOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          )}
          onTransitionEnd={(e) => {
            if (e.propertyName === 'grid-template-rows') setIsTransitioning(false);
          }}
        >
          <div
            className={classNames(
              'min-h-0 min-w-0 lg:contents',
              (!isFilterRowOpen || isTransitioning) && 'overflow-hidden',
            )}
          >
            <div className="flex min-w-0 flex-col gap-4 pt-4 lg:flex-row lg:gap-4 lg:pt-0">
              {children}
              <div className="flex gap-4">
                <div className="min-w-0 flex-1">
                  <InputSelect
                    label="Sort by"
                    options={sortFieldOptions}
                    value={sortField}
                    onChange={(v) => {
                      if (v !== undefined) onSortFieldChange(v);
                    }}
                  />
                </div>
                <div className="self-start lg:flex-none">
                  <InputIconToggle
                    label="Sort order"
                    options={SORT_DIRECTION_OPTIONS}
                    value={sortDirection}
                    onChange={(v) => {
                      if (v) onSortDirectionChange(v);
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
