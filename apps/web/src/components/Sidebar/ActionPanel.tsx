'use client';

import { Suspense, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useBreakpoint } from '@repo/react-common/hooks';

import { Modal } from '@/components/Modal';
import { CategoryView } from '@/features/category/components/CategoryView';
import ItemForm from '@/features/item/components/ItemForm';

import { SidebarNav } from '../Navigation/SidebarNav';

import { SidebarPortal } from '.';

const SIDEBAR_ACTIONS = ['add-item', 'edit-item', 'manage-categories'] as const;
type SidebarAction = (typeof SIDEBAR_ACTIONS)[number];

const MODAL_TITLES: Record<SidebarAction, string> = {
  'add-item': 'Add Item',
  'edit-item': 'Edit Item',
  'manage-categories': 'Categories',
};

function isSidebarAction(value: string | null): value is SidebarAction {
  return SIDEBAR_ACTIONS.includes(value as SidebarAction);
}

function ActionPanelInner() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { isReady, isDesktop } = useBreakpoint();

  const rawAction = searchParams.get('action');
  const action = isSidebarAction(rawAction) ? rawAction : null;
  const itemId = searchParams.get('id') ?? undefined;

  const closeAction = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('action');
    params.delete('id');
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname);
  }, [searchParams, pathname, router]);

  let panelContent: React.ReactNode = null;
  if (action === 'add-item') {
    panelContent = <ItemForm key="add" onClose={closeAction} />;
  } else if (action === 'edit-item' && itemId) {
    panelContent = <ItemForm key={`edit-${itemId}`} itemId={itemId} onClose={closeAction} />;
  } else if (action === 'manage-categories') {
    panelContent = <CategoryView onClose={closeAction} />;
  }

  if (!isReady) return null;

  if (isDesktop) {
    return <SidebarPortal>{panelContent ?? <SidebarNav />}</SidebarPortal>;
  }

  if (!action || !panelContent) return null;

  return (
    <Modal.Root open onOpenChange={closeAction}>
      <Modal.Content title={MODAL_TITLES[action]} className="h-full">
        {panelContent}
      </Modal.Content>
    </Modal.Root>
  );
}

export function ActionPanel() {
  return (
    <Suspense fallback={null}>
      <ActionPanelInner />
    </Suspense>
  );
}
