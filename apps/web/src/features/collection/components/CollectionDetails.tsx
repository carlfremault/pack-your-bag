'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { LinkButton } from '@repo/react-common/button';
import { CollectionDetailsCard } from '@repo/react-common/card';
import { type ColorTheme } from '@repo/react-common/color-themes';

import { SidebarPortal } from '@/components/Sidebar';
import { usePreferences } from '@/features/settings/queries';
import { toCollectionDetailsCardProps } from '@/lib/mappers/collection.mapper';
import { formatWeightForDisplay } from '@/utils/weightUtils';

import { useCollection } from '../queries';
import { CollectionForDetailsCardDisplay, CollectionType } from '../types';
import {
  getCategoryWeightsInList,
  getCategoryWeightsInPack,
  getTotalItemQuantityInList,
  getTotalItemQuantityInPack,
  getTotalWeightInList,
  getTotalWeightInPack,
} from '../utils';

import AddItemsModal from './AddItemsModal';
import AddListsModal from './AddListsModal';
import CollectionDeleteModal from './CollectionDeleteModal';
import ListContent from './ListContent';
import PackContent from './PackContent';

export interface CollectionDetailsProps {
  type: CollectionType;
  id: string;
}

export default function CollectionDetails(props: CollectionDetailsProps) {
  const { type, id } = props;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const action = searchParams.get('action');

  const [deleteCollectionId, setDeleteCollectionId] = useState<string | null>(null);
  const { data: collection } = useCollection(id, type);
  const { data: preferences } = usePreferences();

  const collectionForDetailsCardDisplay = useMemo((): CollectionForDetailsCardDisplay => {
    const isListType = collection.type === 'list';
    const totalWeight = isListType
      ? getTotalWeightInList(collection)
      : getTotalWeightInPack(collection);
    const itemCount = isListType
      ? getTotalItemQuantityInList(collection)
      : getTotalItemQuantityInPack(collection);
    const categoryWeightsRaw = isListType
      ? getCategoryWeightsInList(collection)
      : getCategoryWeightsInPack(collection);
    const categoryWeights = categoryWeightsRaw.map((cw) => {
      const { value, unit } = formatWeightForDisplay(cw.weight, preferences?.units);
      return {
        category: { name: cw.category.name, colorTheme: cw.category.colorTheme as ColorTheme },
        weight: unit ? `${value} ${unit}` : value,
      };
    });
    const { value, unit } = formatWeightForDisplay(totalWeight, preferences?.units);
    return {
      ...collection,
      itemCount,
      totalWeight,
      displayWeight: value,
      displayUnit: unit,
      categoryWeights,
    };
  }, [collection, preferences?.units]);

  const handleEditCollection = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('action', 'edit-collection');
    params.set('id', id);
    params.set('edit-type', type);
    router.replace(`${pathname}?${params.toString()}`);
  }, [id, type, pathname, router, searchParams]);

  const handleDeleteCollection = (id: string) => {
    setDeleteCollectionId(id);
  };

  const closeDeleteModal = () => {
    setDeleteCollectionId(null);
  };

  const collectionDeleteModal = deleteCollectionId && (
    <CollectionDeleteModal
      collectionId={deleteCollectionId}
      collectionType={type}
      onClose={closeDeleteModal}
    />
  );

  const detailsCardProps = toCollectionDetailsCardProps(collectionForDetailsCardDisplay, {
    onEditCollection: handleEditCollection,
    onDeleteCollection: handleDeleteCollection,
  });

  const collectionDetailsContent = (
    <>
      <CollectionDetailsCard {...detailsCardProps} />
      <div className="flex w-full items-center justify-between gap-4">
        <AddItemsModal collection={collection} />
        {collection.type === 'pack' && <AddListsModal pack={collection} />}
      </div>
    </>
  );

  return (
    <div className="flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-4 p-4">
      {/* Mobile */}
      <div className="flex flex-col gap-4 lg:hidden">{collectionDetailsContent}</div>
      {/* Desktop */}
      {!action && (
        <SidebarPortal>
          <div className="flex min-h-0 flex-1 flex-col justify-center gap-4">
            {collectionDetailsContent}
            <LinkButton href="/collections" variant="outline" linkAs={Link} className="w-full">
              Back
            </LinkButton>
          </div>
        </SidebarPortal>
      )}
      {collection.type === 'list' && <ListContent collection={collection} />}
      {collection.type === 'pack' && <PackContent collection={collection} />}
      {collectionDeleteModal}
    </div>
  );
}
