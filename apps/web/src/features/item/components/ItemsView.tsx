'use client';

import { useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { EditDeleteActions } from '@repo/react-common/dialog';

import { EmptyState } from '@/components/EmptyState';
import { usePreferences } from '@/features/settings/queries';
import { useUrlFilterItems } from '@/hooks/useUrlFilterItems';
import { formatWeightForDisplay } from '@/utils/weightUtils';

import { useAllItems } from '../queries';
import { ItemForDisplay } from '../types';

import ItemDeleteModal from './ItemDeleteModal';
import ItemFilter from './ItemFilter';
import ItemsList from './ItemsList';
import ItemsTable from './ItemsTable';

export default function ItemsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const { data } = useAllItems();
  const { data: preferences } = usePreferences();

  const itemsForDisplay = useMemo(() => {
    return data.map((item) => {
      const hasWeight = item.weight != null;
      const { value, unit } = hasWeight
        ? formatWeightForDisplay(Number(item.weight), preferences?.units)
        : { value: null, unit: null };
      return { ...item, displayWeight: value, displayUnit: unit };
    });
  }, [data, preferences?.units]);

  const { filteredItems, displayFilterState, handleFilterChange } = useUrlFilterItems({
    items: itemsForDisplay,
    sortFieldKey: 'itemSortField',
    sortDirKey: 'itemSortDir',
  });

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

  const handleCloseDeleteModal = () => setDeleteItemId(null);

  const itemsActions = useCallback(
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

  const itemDeleteModal = deleteItemId && (
    <ItemDeleteModal itemId={deleteItemId} onClose={handleCloseDeleteModal} />
  );

  const noResults = (
    <EmptyState
      message="No items found."
      suggestion="Create some items to start packing!"
      hasActiveFilters={!!displayFilterState.search || !!displayFilterState.category}
    />
  );

  return (
    <>
      {/* Mobile */}
      <div className="mb-32 flex w-full max-w-3xl flex-col gap-4 p-4 lg:hidden">
        <ItemFilter filterState={displayFilterState} onChange={handleFilterChange} />
        <ItemsList items={filteredItems} itemsActions={itemsActions} noResults={noResults} />
      </div>
      {/* Desktop */}
      <div className="hidden h-full w-full max-w-7xl flex-col gap-4 overflow-hidden p-4 lg:flex">
        <ItemFilter filterState={displayFilterState} onChange={handleFilterChange} />
        <div className="min-h-0 flex-1">
          <ItemsTable items={filteredItems} itemsActions={itemsActions} noResults={noResults} />
        </div>
      </div>
      {itemDeleteModal}
    </>
  );
}
