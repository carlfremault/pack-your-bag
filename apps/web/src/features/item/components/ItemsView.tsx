'use client';

import { useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useBreakpoint } from '@repo/react-common/hooks';
import { Spinner } from '@repo/react-common/spinner';

import { Modal } from '@/components/Modal';
import { SidebarNav } from '@/components/Navigation/SidebarNav';
import { SidebarPortal } from '@/components/Sidebar';
import { CategoryView } from '@/features/category/components/CategoryView';

import { useAllItems } from '../queries';

import DesktopItemsTable from './DesktopItemsTable';
import ItemDeleteModal from './ItemDeleteModal';
import { ItemFilter, ItemFilterState } from './ItemFilter';
import ItemForm from './ItemForm';
import MobileItemsList from './MobileItemsList';

const MODAL_TITLES = { add: 'Add Item', edit: 'Edit Item', categories: 'Categories' } as const;

const DEFAULT_FILTER_STATE: ItemFilterState = {
  search: '',
  categoryId: '',
  sortField: 'name',
  sortDirection: 'asc',
};

export default function ItemsView() {
  // Hooks
  const { isReady, isDesktop } = useBreakpoint();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data = [], isLoading } = useAllItems();
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<ItemFilterState>(DEFAULT_FILTER_STATE);

  // Variables
  const rawAction = searchParams.get('action');
  const formAction =
    rawAction === 'add' || rawAction === 'edit' || rawAction === 'categories' ? rawAction : null;
  const itemId = searchParams.get('id');
  const actionItem = data.find((item) => item.id === itemId);
  const isFormReady = formAction === 'add' || (formAction === 'edit' && actionItem !== undefined);
  const formKey = formAction === 'edit' ? `edit-${actionItem?.id}` : 'add';

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
      } else if (filterState.sortField === 'category') {
        cmp = (a.category?.name ?? '')
          .toLowerCase()
          .localeCompare((b.category?.name ?? '').toLowerCase());
      } else {
        cmp = 0;
      }
      return filterState.sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [data, filterState]);

  // Handlers
  const handleFilterChange = useCallback(
    (updates: Partial<ItemFilterState>) => setFilterState((prev) => ({ ...prev, ...updates })),
    [],
  );

  const closeFormAction = useCallback(
    (isOpen?: boolean) => {
      if (isOpen) return;
      const params = new URLSearchParams(searchParams.toString());
      params.delete('action');
      params.delete('id');
      const nextQuery = params.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const handleEditItem = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('action', 'edit');
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

  // Render
  let panelContent: React.ReactNode = null;
  if (formAction === 'categories') {
    panelContent = <CategoryView />;
  } else if (formAction && isFormReady) {
    panelContent = <ItemForm key={formKey} item={formAction === 'edit' ? actionItem : undefined} />;
  }

  const modalTitle = formAction ? MODAL_TITLES[formAction] : '';
  const deleteItemModal = deleteItemId && (
    <ItemDeleteModal itemId={deleteItemId} onClose={closeDeleteModal} />
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
        {formAction && (
          <Modal.Root open onOpenChange={closeFormAction}>
            <Modal.Content title={modalTitle} className="h-full">
              {panelContent ?? <Spinner size="small" />}
            </Modal.Content>
          </Modal.Root>
        )}
        {deleteItemModal}
      </>
    );
  }

  return (
    <>
      <SidebarPortal>{panelContent ?? <SidebarNav />}</SidebarPortal>
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
