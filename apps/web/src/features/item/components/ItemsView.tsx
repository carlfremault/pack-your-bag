'use client';

import { useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Alert } from '@repo/react-common/alert';
import { useBreakpoint } from '@repo/react-common/hooks';
import { EditDeleteActions } from '@repo/react-common/table';
import { PageNotReady } from '@repo/react-common/utils';

import { usePreferences } from '@/features/settings/queries';
import { useRestoreSortFromSession } from '@/hooks/useRestoreSortFromSession';
import { useSearchDraft } from '@/hooks/useSearchDraft';
import { formatWeightForDisplay } from '@/utils/weightUtils';

import { useAllItems } from '../queries';
import { ItemForDisplay } from '../types';

import ItemDeleteModal from './ItemDeleteModal';
import { ItemFilter, ItemFilterState } from './ItemFilter';
import ItemsList from './ItemsList';
import ItemsTable from './ItemsTable';

export default function ItemsView() {
  const { isReady, isDesktop } = useBreakpoint();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { searchDraft, handleSearchChange } = useSearchDraft();
  useRestoreSortFromSession({
    sortFieldKey: 'itemSortField',
    sortDirKey: 'itemSortDir',
    defaultSortField: 'name',
  });

  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const { data = [], isLoading: isItemsLoading, isError: isItemsError } = useAllItems();
  const { data: preferences, isLoading: isPreferencesLoading } = usePreferences();
  const isLoading = isItemsLoading || isPreferencesLoading;

  const itemsForDisplay = useMemo(() => {
    return data.map((item) => {
      const hasWeight = item.weight != null;
      const { value, unit } = hasWeight
        ? formatWeightForDisplay(Number(item.weight), preferences?.units)
        : { value: null, unit: null };
      return { ...item, displayWeight: value, displayUnit: unit };
    });
  }, [data, preferences?.units]);

  const filterState: ItemFilterState = useMemo(() => {
    const rawSort = searchParams.get('sort');
    const rawDir = searchParams.get('dir');
    return {
      search: searchParams.get('search') ?? '',
      category: searchParams.get('category') ?? '',
      sortField: rawSort === 'weight' || rawSort === 'category' ? rawSort : 'name',
      sortDirection: rawDir === 'desc' ? 'desc' : 'asc',
    };
  }, [searchParams]);

  const displayFilterState: ItemFilterState = { ...filterState, search: searchDraft };

  const filteredItems = useMemo(() => {
    let result = [...itemsForDisplay];

    if (searchDraft) {
      const term = searchDraft.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          (item.description?.toLowerCase().includes(term) ?? false),
      );
    }

    if (filterState.category) {
      result = result.filter((item) => item.category?.name === filterState.category);
    }

    result.sort((a, b) => {
      let cmp: number;
      if (filterState.sortField === 'weight') {
        cmp = (a.weight != null ? Number(a.weight) : 0) - (b.weight != null ? Number(b.weight) : 0);
      } else if (filterState.sortField === 'name') {
        cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      } else if (filterState.sortField === 'category') {
        cmp = (a.category?.name ?? '')
          .toLowerCase()
          .localeCompare((b.category?.name ?? '').toLowerCase());
      } else {
        cmp = 0;
      }
      if (cmp === 0 && filterState.sortField !== 'name') {
        cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      }
      return filterState.sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [
    itemsForDisplay,
    searchDraft,
    filterState.category,
    filterState.sortField,
    filterState.sortDirection,
  ]);

  const handleFilterChange = useCallback(
    (updates: Partial<ItemFilterState>) => {
      if (updates.search !== undefined) {
        handleSearchChange(updates.search);
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      if (updates.category !== undefined) {
        if (updates.category) params.set('category', updates.category);
        else params.delete('category');
      }
      if (updates.sortField !== undefined) {
        if (updates.sortField !== 'name') params.set('sort', updates.sortField);
        else params.delete('sort');
        sessionStorage.setItem('itemSortField', updates.sortField);
      }
      if (updates.sortDirection !== undefined) {
        if (updates.sortDirection !== 'asc') params.set('dir', updates.sortDirection);
        else params.delete('dir');
        sessionStorage.setItem('itemSortDir', updates.sortDirection);
      }
      router.replace(`${pathname}?${params.toString()}`);
    },
    [handleSearchChange, pathname, router, searchParams],
  );

  const handleEditItem = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('action', 'edit-item');
      params.set('id', id);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const handleDeleteItem = useCallback((id: string) => {
    setDeleteItemId(id);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeleteItemId(null);
  }, []);

  const ItemsActions = useCallback(
    ({ id, name }: ItemForDisplay) => {
      return (
        <EditDeleteActions
          name={name}
          id={id}
          onEdit={handleEditItem}
          onDelete={handleDeleteItem}
        />
      );
    },
    [handleEditItem, handleDeleteItem],
  );

  if (!isReady) {
    return <PageNotReady />;
  }

  if (isItemsError && !data.length) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <Alert type="error" message="Failed to load items. Please try again later." />
      </div>
    );
  }

  const itemDeleteModal = deleteItemId && (
    <ItemDeleteModal itemId={deleteItemId} onClose={closeDeleteModal} />
  );

  if (!isDesktop) {
    return (
      <>
        <div className="flex w-full max-w-3xl flex-col gap-4 p-4">
          <ItemFilter filterState={displayFilterState} onChange={handleFilterChange} />
          <ItemsList items={filteredItems} isLoading={isLoading} itemsActions={ItemsActions} />
        </div>
        {itemDeleteModal}
      </>
    );
  }

  return (
    <>
      <div className="flex w-full flex-col gap-4 p-4">
        <ItemFilter filterState={displayFilterState} onChange={handleFilterChange} />
        <div className="min-h-0 flex-1">
          <ItemsTable items={filteredItems} isLoading={isLoading} itemsActions={ItemsActions} />
        </div>
      </div>
      {itemDeleteModal}
    </>
  );
}
