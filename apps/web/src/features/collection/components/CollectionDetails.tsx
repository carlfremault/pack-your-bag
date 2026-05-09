'use client';

import { useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Alert } from '@repo/react-common/alert';
import { CollectionHeaderCard } from '@repo/react-common/card';
import { type ColorTheme } from '@repo/react-common/color-themes';
import { useBreakpoint } from '@repo/react-common/hooks';
import { PageNotReady } from '@repo/react-common/utils';

import { usePreferences } from '@/features/settings/queries';
import { toCollectionHeaderCardProps } from '@/lib/mappers/collection.mapper';
import { formatWeightForDisplay } from '@/utils/weightUtils';

import { useCollection } from '../queries';
import { CollectionForHeaderDisplay, CollectionType } from '../types';
import {
  getCategoryWeightsInList,
  getCategoryWeightsInPack,
  getTotalItemQuantityInList,
  getTotalItemQuantityInPack,
  getTotalWeightInList,
  getTotalWeightInPack,
} from '../utils';

import CollectionDeleteModal from './CollectionDeleteModal';
import ListContent from './ListContent';
import PackContent from './PackContent';

export interface CollectionDetailsProps {
  type: CollectionType;
  id: string;
}

export default function CollectionDetails(props: CollectionDetailsProps) {
  const { type, id } = props;

  const { isReady, isDesktop } = useBreakpoint();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [deleteCollectionId, setDeleteCollectionId] = useState<string | null>(null);
  const { data: collection, isLoading, isError } = useCollection(id, type);
  const { data: preferences } = usePreferences();

  const collectionForHeaderDisplay = useMemo((): CollectionForHeaderDisplay | undefined => {
    if (!collection) return undefined;
    const totalWeight =
      collection.type === 'list'
        ? getTotalWeightInList(collection)
        : getTotalWeightInPack(collection);
    const itemCount =
      collection.type === 'list'
        ? getTotalItemQuantityInList(collection)
        : getTotalItemQuantityInPack(collection);
    const categoryWeightsRaw =
      collection.type === 'list'
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

  const handleEditCollection = useCallback(
    (id: string, type: CollectionType) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('action', 'edit-collection');
      params.set('id', id);
      params.set('edit-type', type);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const handleDeleteCollection = (id: string) => {
    setDeleteCollectionId(id);
  };

  const closeDeleteModal = () => {
    setDeleteCollectionId(null);
  };

  if (!isReady) {
    return <PageNotReady />;
  }

  if (isError && !collection) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Alert type="error" message="Failed to load collection. Please try again later." />
      </div>
    );
  }

  const collectionDeleteModal = deleteCollectionId && (
    <CollectionDeleteModal
      collectionId={deleteCollectionId}
      collectionType={type}
      onClose={closeDeleteModal}
    />
  );

  return (
    <div className="bg-surface border-primary-ring m-4 flex w-full flex-col gap-4 rounded-md border p-4 shadow-sm">
      {collectionForHeaderDisplay && (
        <CollectionHeaderCard
          {...toCollectionHeaderCardProps(collectionForHeaderDisplay, isLoading, {
            onEditCollection: handleEditCollection,
            onDeleteCollection: handleDeleteCollection,
          })}
        />
      )}
      {collection?.type === 'list' && <ListContent collection={collection} isDesktop={isDesktop} />}
      {collection?.type === 'pack' && <PackContent collection={collection} isDesktop={isDesktop} />}
      {collectionDeleteModal}
    </div>
  );
}
