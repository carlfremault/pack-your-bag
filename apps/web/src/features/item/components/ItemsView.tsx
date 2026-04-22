'use client';

import { useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useBreakpoint } from '@repo/react-common/hooks';
import { Spinner } from '@repo/react-common/spinner';

import { useAllItems } from '../queries';

import DeleteItemModal from './DeleteItemModal';
import DesktopItemsTable from './DesktopItemsTable';
import { ItemFilter, ItemFilterState } from './ItemFilter';
import MobileItemsList from './MobileItemsList';

const DEFAULT_FILTER_STATE: ItemFilterState = {
  search: '',
  categoryId: '',
  sortField: 'name',
  sortDirection: 'asc',
};

export default function ItemsView() {
  const { isReady, isDesktop } = useBreakpoint();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data = [], isLoading } = useAllItems();
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<ItemFilterState>(DEFAULT_FILTER_STATE);

  const filteredItems = useMemo(() => {
    let result = [...data];

    if (filterState.search) {
      const term = filterState.search.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          (item.description?.toLowerCase().includes(term) ?? false),
      );
    }

    if (filterState.categoryId) {
      result = result.filter((item) => item.category?.id === filterState.categoryId);
    }

    result.sort((a, b) => {
      let cmp: number;
      if (filterState.sortField === 'weight') {
        cmp = (a.weight ?? 0) - (b.weight ?? 0);
      } else if (filterState.sortField === 'name') {
        cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      } else {
        cmp = (a.category?.name ?? '')
          .toLowerCase()
          .localeCompare((b.category?.name ?? '').toLowerCase());
      }
      return filterState.sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [data, filterState]);

  const handleFilterChange = useCallback(
    (updates: Partial<ItemFilterState>) => setFilterState((prev) => ({ ...prev, ...updates })),
    [],
  );

  const handleEditItem = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('action', 'edit-item');
      params.set('id', id);
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const handleDeleteItem = useCallback((id: string) => {
    setDeleteItemId(id);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeleteItemId(null);
  }, []);

  if (!isReady) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  const deleteItemModal = deleteItemId && (
    <DeleteItemModal itemId={deleteItemId} onClose={closeDeleteModal} />
  );

  if (!isDesktop) {
    return (
      <>
        <div className="flex w-full max-w-3xl flex-col gap-4 p-4">
          <ItemFilter filterState={filterState} onChange={handleFilterChange} />
          <MobileItemsList
            items={filteredItems}
            isLoading={isLoading}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
          />
        </div>
        {deleteItemModal}
      </>
    );
  }

  return (
    <>
      <div className="flex w-full flex-col gap-4 p-4">
        <ItemFilter filterState={filterState} onChange={handleFilterChange} />
        <DesktopItemsTable
          items={filteredItems}
          isLoading={isLoading}
          onEditItem={handleEditItem}
          onDeleteItem={handleDeleteItem}
        />
      </div>
      {deleteItemModal}
    </>
  );
}
