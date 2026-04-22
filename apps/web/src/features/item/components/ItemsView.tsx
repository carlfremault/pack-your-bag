'use client';

import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useBreakpoint } from '@repo/react-common/hooks';
import { Spinner } from '@repo/react-common/spinner';

import { Modal } from '@/components/Modal';
import { SidebarNav } from '@/components/Navigation/SidebarNav';
import { SidebarPortal } from '@/components/Sidebar';
import { CategoryView } from '@/features/category/components/CategoryView';
import { extractErrorMessage } from '@/utils/extractApiErrorDetails';

import { useAllItems, useDeleteItem } from '../queries';

import DeleteItemModal from './DeleteItemModal';
import DesktopItemsTable from './DesktopItemsTable';
import ItemForm from './ItemForm';
import MobileItemsList from './MobileItemsList';

const MODAL_TITLES = { add: 'Add Item', edit: 'Edit Item', categories: 'Categories' } as const;

export default function ItemsView() {
  const { isReady, isDesktop } = useBreakpoint();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data = [], isLoading } = useAllItems();

  const rawAction = searchParams.get('action');
  const formAction =
    rawAction === 'add' || rawAction === 'edit' || rawAction === 'categories' ? rawAction : null;
  const itemId = searchParams.get('id');
  const actionItem = data.find((item) => item.id === itemId);
  const isFormReady = formAction === 'add' || (formAction === 'edit' && actionItem !== undefined);
  const formKey = formAction === 'edit' ? `edit-${actionItem?.id}` : 'add';

  const { mutate: deleteItem, isPending: isDeleting } = useDeleteItem();
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const itemToDelete = data.find((item) => item.id === deleteItemId) ?? null;

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

  const confirmDeleteItem = useCallback(() => {
    if (!deleteItemId) return;
    deleteItem(deleteItemId, {
      onSuccess: () => {
        closeDeleteModal();
        toast.success('Item deleted successfully');
      },
      onError: (error) => {
        toast.error(`Error: ${extractErrorMessage(error)}`);
      },
    });
  }, [deleteItemId, deleteItem, closeDeleteModal]);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  let panelContent: React.ReactNode = null;
  if (formAction === 'categories') {
    panelContent = <CategoryView />;
  } else if (formAction && isFormReady) {
    panelContent = <ItemForm key={formKey} item={formAction === 'edit' ? actionItem : undefined} />;
  }

  const modalTitle = formAction ? MODAL_TITLES[formAction] : '';

  if (!isDesktop) {
    return (
      <>
        <MobileItemsList
          items={data}
          isLoading={isLoading}
          onEditItem={handleEditItem}
          onDeleteItem={handleDeleteItem}
        />
        {formAction && (
          <Modal.Root open onOpenChange={closeFormAction}>
            <Modal.Content title={modalTitle} className="h-full">
              {panelContent ?? <Spinner size="small" />}
            </Modal.Content>
          </Modal.Root>
        )}
        {itemToDelete && (
          <DeleteItemModal
            isDeleting={isDeleting}
            onConfirm={confirmDeleteItem}
            onClose={closeDeleteModal}
          />
        )}
      </>
    );
  }

  return (
    <>
      <SidebarPortal>{panelContent ?? <SidebarNav />}</SidebarPortal>
      <DesktopItemsTable
        items={data}
        isLoading={isLoading}
        onEditItem={handleEditItem}
        onDeleteItem={handleDeleteItem}
      />
      {itemToDelete && (
        <DeleteItemModal
          isDeleting={isDeleting}
          onConfirm={confirmDeleteItem}
          onClose={closeDeleteModal}
        />
      )}
    </>
  );
}
