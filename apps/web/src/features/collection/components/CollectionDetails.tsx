'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Alert } from '@repo/react-common/alert';
import { CollectionHeaderCard } from '@repo/react-common/card';
import { Spinner } from '@repo/react-common/spinner';

import { usePreferences } from '@/features/settings/queries';
import { toCollectionHeaderCardProps } from '@/lib/mappers/collection.mapper';
import {
  getCategoryWeightsInList,
  getCategoryWeightsInPack,
  getTotalItemQuantityInList,
  getTotalItemQuantityInPack,
  getTotalWeightInList,
  getTotalWeightInPack,
} from '@/utils/collectionsUtils';
import { formatWeightForDisplay } from '@/utils/weightUtils';

import { useCollection } from '../queries';
import { CollectionForHeaderDisplay, CollectionType } from '../types';

export interface CollectionDetailsProps {
  type: CollectionType;
  id: string;
}

export default function CollectionDetails(props: CollectionDetailsProps) {
  const { type, id } = props;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data: collection, isLoading: isCollectionLoading, isError } = useCollection(id, type);
  const { data: preferences, isLoading: isPreferencesLoading } = usePreferences();
  const isLoading = isCollectionLoading || isPreferencesLoading;

  const collectionForDisplay: CollectionForHeaderDisplay | undefined = useMemo(() => {
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
    const categoryWeights = categoryWeightsRaw.map((cw) => ({
      category: { name: cw.category.name, colorTheme: cw.category.colorTheme },
      weight: formatWeightForDisplay(cw.weight, preferences?.units).value,
    }));
    const { value, unit } = formatWeightForDisplay(totalWeight, preferences?.units);
    return {
      ...collection,
      itemCount,
      displayWeight: value,
      displayUnit: unit,
      categoryWeights,
    } as CollectionForHeaderDisplay;
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

  // TODO: Implement delete collection
  const handleDeleteCollection = () => {};

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  if (isError && !collection) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Alert type="error" message="Failed to load collection. Please try again later." />
      </div>
    );
  }

  return (
    <div className="bg-surface border-primary-ring m-4 flex w-full flex-col gap-4 rounded-md border p-4 shadow-sm">
      {collectionForDisplay && (
        <CollectionHeaderCard
          {...toCollectionHeaderCardProps(collectionForDisplay, {
            onEditCollection: handleEditCollection,
            onDeleteCollection: handleDeleteCollection,
          })}
        />
      )}
    </div>
  );
}
