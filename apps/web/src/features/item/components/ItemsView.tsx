'use client';

import { useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useBreakpoint } from '@repo/react-common/hooks';
import { Spinner } from '@repo/react-common/spinner';

import { Modal } from '@/components/Modal';
import { SidebarPortal } from '@/components/Sidebar';
import { extractErrorMessage } from '@/utils/extractApiErrorDetails';

import { useAllItems } from '../queries';

import DesktopItemsTable from './DesktopItemsTable';
import ItemForm from './ItemForm';
import MobileItemsList from './MobileItemsList';
import SidebarAddItem from './SidebarAddItem';

function ItemsView() {
  const { isReady, isDesktop } = useBreakpoint();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawAction = searchParams.get('action');
  const action = rawAction === 'add' || rawAction === 'edit' ? rawAction : null;
  const itemId = searchParams.get('id');

  const { data = [], isLoading, isError, error } = useAllItems();
  const editedItem = data.find((item) => item.id === itemId);
  const isEditReady = action !== 'edit' || editedItem !== undefined;

  const formKey = action === 'edit' ? `edit-${editedItem?.id}` : 'add';
  const form = action && isEditReady ? <ItemForm key={formKey} item={editedItem} /> : null;

  const handleModalOpenChange = (isOpen: boolean) => {
    if (isOpen) return;

    const params = new URLSearchParams(searchParams.toString());
    params.delete('action');
    params.delete('id');
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  };

  const handleEditItem = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('action', 'edit');
      params.set('id', id);
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (isError) {
      toast.error(extractErrorMessage(error));
    }
  }, [isError, error]);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  if (!isDesktop) {
    return (
      <>
        <MobileItemsList items={data} isLoading={isLoading} onEditItem={handleEditItem} />
        {action && (
          <Modal.Root open onOpenChange={handleModalOpenChange}>
            <Modal.Content title={action === 'add' ? 'Add Item' : 'Edit Item'}>
              {form}
            </Modal.Content>
          </Modal.Root>
        )}
      </>
    );
  }

  return (
    <>
      <SidebarPortal>{action ? form : <SidebarAddItem />}</SidebarPortal>
      <DesktopItemsTable items={data} isLoading={isLoading} onEditItem={handleEditItem} />
    </>
  );
}

export default ItemsView;
