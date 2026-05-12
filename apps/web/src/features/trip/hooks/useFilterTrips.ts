import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useRestoreSortFromSession } from '@/hooks/useRestoreSortFromSession';
import { useSearchDraft } from '@/hooks/useSearchDraft';

import { TripFilterState } from '../components/TripFilter';
import { TripSummary } from '../types';

const TRIP_SORT_FIELD_KEY = 'tripSortField';
const TRIP_SORT_DIR_KEY = 'tripSortDir';

export function useFilterTrips({ trips }: { trips: TripSummary[] }) {
  const { searchDraft, handleSearchChange } = useSearchDraft();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sessionSort = useRestoreSortFromSession({
    sortFieldKey: TRIP_SORT_FIELD_KEY,
    sortDirKey: TRIP_SORT_DIR_KEY,
    defaultSortField: 'name',
  });

  const filterState: TripFilterState = useMemo(() => {
    const rawSort = searchParams.get('sort') ?? sessionSort.field;
    const rawDir = searchParams.get('dir') ?? sessionSort.dir;
    return {
      search: searchParams.get('search') ?? '',
      dateFrom: searchParams.get('date-from') ?? undefined,
      dateUntil: searchParams.get('date-until') ?? undefined,
      sortField: rawSort === 'date' ? rawSort : 'name',
      sortDirection: rawDir === 'desc' ? 'desc' : 'asc',
    };
  }, [searchParams, sessionSort]);

  const displayFilterState: TripFilterState = { ...filterState, search: searchDraft };

  const filteredTrips = useMemo(() => {
    let result = [...trips];

    if (searchDraft) {
      const term = searchDraft.toLowerCase();
      result = result.filter(
        (trip) =>
          trip.name.toLowerCase().includes(term) ||
          (trip.remarks?.toLowerCase().includes(term) ?? false),
      );
    }

    if (filterState.dateFrom) {
      const dateFrom = filterState.dateFrom;
      result = result.filter((trip) => trip.date && trip.date.substring(0, 10) >= dateFrom);
    }
    if (filterState.dateUntil) {
      const dateUntil = filterState.dateUntil;
      result = result.filter((trip) => trip.date && trip.date.substring(0, 10) <= dateUntil);
    }

    result.sort((a, b) => {
      let cmp: number;
      if (filterState.sortField === 'date') {
        cmp = (a.date ?? '').localeCompare(b.date ?? '');
        if (cmp === 0) cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      } else {
        cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      }
      return filterState.sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [
    trips,
    searchDraft,
    filterState.dateFrom,
    filterState.dateUntil,
    filterState.sortField,
    filterState.sortDirection,
  ]);

  const handleFilterChange = useCallback(
    (updates: Partial<TripFilterState>) => {
      if (updates.search !== undefined) {
        handleSearchChange(updates.search);
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      if ('dateFrom' in updates) {
        if (updates.dateFrom) {
          params.set('date-from', updates.dateFrom);
        } else {
          params.delete('date-from');
        }
      }
      if ('dateUntil' in updates) {
        if (updates.dateUntil) {
          params.set('date-until', updates.dateUntil);
        } else {
          params.delete('date-until');
        }
      }
      if (updates.sortField !== undefined) {
        params.set('sort', updates.sortField);
        sessionStorage.setItem(TRIP_SORT_FIELD_KEY, updates.sortField);
      }
      if (updates.sortDirection !== undefined) {
        params.set('dir', updates.sortDirection);
        sessionStorage.setItem(TRIP_SORT_DIR_KEY, updates.sortDirection);
      }
      router.replace(`${pathname}?${params.toString()}`);
    },
    [handleSearchChange, pathname, router, searchParams],
  );

  return { filteredTrips, displayFilterState, handleFilterChange };
}
