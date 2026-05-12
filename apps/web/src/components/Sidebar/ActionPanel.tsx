'use client';

import { Suspense, useCallback, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Units } from '@repo/constants';
import { useBreakpoint } from '@repo/react-common/hooks';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Modal } from '@/components/Modal';
import { CategoryTableSkeleton } from '@/features/category/components/CategoryTableSkeleton';
import { CategoryView, type CategoryViewMode } from '@/features/category/components/CategoryView';
import CollectionForm from '@/features/collection/components/CollectionForm';
import { CollectionType } from '@/features/collection/types';
import ItemForm from '@/features/item/components/ItemForm';
import { usePreferences } from '@/features/settings/queries';
import TripForm from '@/features/trip/components/TripForm';

import ErrorFallback from '../ErrorFallback';
import { AddModalTitle, EditModalTitle } from '../Modal/ModalTitle';
import { SidebarNav } from '../Navigation/SidebarNav';

import { SidebarPortal } from '.';

const SIDEBAR_ACTIONS = [
  'add-item',
  'edit-item',
  'add-collection',
  'edit-collection',
  'add-trip',
  'manage-categories',
] as const;
type SidebarAction = (typeof SIDEBAR_ACTIONS)[number];

const MODAL_TITLES: Record<SidebarAction, string> = {
  'add-item': 'Add item',
  'edit-item': 'Edit item',
  'add-collection': 'Add collection',
  'edit-collection': 'Edit collection',
  'add-trip': 'Add trip',
  'manage-categories': 'Categories',
};

const CATEGORY_DESKTOP_TITLES: Record<CategoryViewMode, string> = {
  table: 'Categories',
  add: 'Add category',
  edit: 'Edit category',
};

export function ActionPanel() {
  return (
    <Suspense fallback={null}>
      <ActionPanelInner />
    </Suspense>
  );
}

function ActionPanelInner() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { isReady, isDesktop } = useBreakpoint();

  const { data: preferences } = usePreferences();
  const units = isValidUnits(preferences?.units) ? preferences.units : Units.METRIC;

  const rawAction = searchParams.get('action');
  const action = isSidebarAction(rawAction) ? rawAction : null;
  const id = searchParams.get('id') ?? undefined;
  const editCollectionType = searchParams.get('edit-type') ?? undefined;

  const [categoryMode, setCategoryMode] = useState<CategoryViewMode>('table');

  const closeAction = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('action');
    params.delete('id');
    params.delete('edit-type');
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname);
  }, [searchParams, pathname, router]);

  const handleCategoryRenamed = useCallback(
    (oldName: string, newName: string) => {
      if (searchParams.get('category') !== oldName) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set('category', newName);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router],
  );

  const handleCategoryDeleted = useCallback(
    (name: string) => {
      if (searchParams.get('category') !== name) return;
      const params = new URLSearchParams(searchParams.toString());
      params.delete('category');
      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname);
    },
    [searchParams, pathname, router],
  );

  if (!isReady) return null;

  let panelContent: React.ReactNode = null;
  let desktopTitle: string | null = null;
  if (action === 'add-item') {
    panelContent = <ItemForm key="addItem" units={units} onClose={closeAction} />;
    desktopTitle = 'Add item';
  } else if (action === 'edit-item' && id) {
    panelContent = <ItemForm key={`edit-${id}`} itemId={id} units={units} onClose={closeAction} />;
    desktopTitle = 'Edit item';
  } else if (action === 'add-collection') {
    panelContent = <CollectionForm key="addCollection" onClose={closeAction} />;
    desktopTitle = 'Add collection';
  } else if (action === 'edit-collection' && id && isCollectionType(editCollectionType)) {
    panelContent = (
      <CollectionForm
        key={`edit-${id}`}
        collectionId={id}
        collectionType={editCollectionType}
        onClose={closeAction}
      />
    );
    desktopTitle = 'Edit collection';
  } else if (action === 'add-trip') {
    panelContent = <TripForm key="addTrip" onClose={closeAction} />;
    desktopTitle = 'Add trip';
  } else if (action === 'manage-categories') {
    panelContent = (
      <ErrorBoundary
        fallback={<ErrorFallback message="Failed to load categories. Please try again later." />}
      >
        <Suspense fallback={<CategoryTableSkeleton />}>
          <CategoryView
            onClose={closeAction}
            onModeChange={setCategoryMode}
            onCategoryRenamed={handleCategoryRenamed}
            onCategoryDeleted={handleCategoryDeleted}
          />
        </Suspense>
      </ErrorBoundary>
    );
    desktopTitle = CATEGORY_DESKTOP_TITLES[categoryMode];
  }

  const isCollectionDetailPage = /^\/(list|pack)\/[^/]+/.test(pathname);
  const isCollectionAction = action === 'add-collection' || action === 'edit-collection';

  // Desktop: Sidebar
  if (isDesktop) {
    // Collection detail page loads collection summary card
    if (isCollectionDetailPage && !isCollectionAction) return null;
    if (panelContent) {
      return (
        <SidebarPortal>
          <div className="flex min-h-0 flex-1 flex-col justify-center gap-4">
            {desktopTitle && <h2 className="text-primary text-xl">{desktopTitle}</h2>}
            {panelContent}
          </div>
        </SidebarPortal>
      );
    }

    return (
      <SidebarPortal>
        <SidebarNav pathname={pathname} />
      </SidebarPortal>
    );
  }

  // Mobile: Modal
  if (!action || !panelContent) return null;

  return (
    <Modal.Root open onOpenChange={closeAction}>
      <Modal.Content
        title={getModalTitle(action, categoryMode, editCollectionType)}
        className="h-full"
      >
        {panelContent}
      </Modal.Content>
    </Modal.Root>
  );
}

function getModalTitle(
  action: SidebarAction,
  categoryMode: CategoryViewMode,
  editCollectionType?: string,
): React.ReactNode {
  if (action === 'add-item') return <AddModalTitle label="Add item" />;
  if (action === 'add-collection') return <AddModalTitle label="Add collection" />;
  if (action === 'edit-item') return <EditModalTitle label="Edit item" />;
  if (action === 'edit-collection') return <EditModalTitle label={`Edit ${editCollectionType}`} />;
  if (action === 'add-trip') return <AddModalTitle label="Add trip" />;
  if (action === 'manage-categories') {
    if (categoryMode === 'add') return <AddModalTitle label="Add category" />;
    if (categoryMode === 'edit') return <EditModalTitle label="Edit category" />;
    return MODAL_TITLES['manage-categories'];
  }
  return MODAL_TITLES[action];
}

function isSidebarAction(value: string | null): value is SidebarAction {
  return SIDEBAR_ACTIONS.includes(value as SidebarAction);
}

function isValidUnits(value: unknown): value is Units {
  return Object.values(Units).includes(value as Units);
}

const COLLECTION_TYPES = ['list', 'pack'] as const;
function isCollectionType(v: string | undefined): v is CollectionType {
  return COLLECTION_TYPES.includes(v as CollectionType);
}
