'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Alert } from '@repo/react-common/alert';
import { CollectionHeaderCard } from '@repo/react-common/card';
import { useBreakpoint } from '@repo/react-common/hooks';
import { QuantityStepper } from '@repo/react-common/input';
import { PageNotReady } from '@repo/react-common/utils';

import ItemsList from '@/features/item/components/ItemsList';
import ItemsTable from '@/features/item/components/ItemsTable';
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
import { CollectionForHeaderDisplay, CollectionItemForDisplay, CollectionType } from '../types';

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
    const categoryWeights = categoryWeightsRaw.map((cw) => {
      const { value, unit } = formatWeightForDisplay(cw.weight, preferences?.units);
      return {
        category: { name: cw.category.name, colorTheme: cw.category.colorTheme },
        weight: unit ? `${value} ${unit}` : value,
      };
    });
    const { value, unit } = formatWeightForDisplay(totalWeight, preferences?.units);
    return {
      ...collection,
      itemCount,
      displayWeight: value,
      displayUnit: unit,
      categoryWeights,
    } as CollectionForHeaderDisplay;
  }, [collection, preferences?.units]);

  const collectionItemsForDisplay = useMemo((): CollectionItemForDisplay[] => {
    if (!collection) return [];
    return (collection.items ?? []).map(({ quantity, item }) => {
      const { value, unit } =
        item.weight != null
          ? formatWeightForDisplay(Number(item.weight), preferences?.units)
          : { value: null, unit: null };
      return { ...item, quantity, displayWeight: value, displayUnit: unit };
    });
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

  const ItemsActions = useCallback(
    ({ quantity }: CollectionItemForDisplay) => (
      // TODO: Implement quantity stepper onChange
      <QuantityStepper quantity={quantity} onChange={() => {}} />
    ),
    [],
  );

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

  const itemsView = isDesktop ? (
    <ItemsTable
      items={collectionItemsForDisplay}
      isLoading={isLoading}
      actionsTitle="Quantity"
      actionSize={120}
      itemsActions={ItemsActions}
    />
  ) : (
    <ItemsList
      items={collectionItemsForDisplay}
      isLoading={isLoading}
      itemsActions={ItemsActions}
    />
  );

  return (
    <div className="bg-surface border-primary-ring m-4 flex w-full flex-col gap-4 rounded-md border p-4 shadow-sm">
      {collectionForDisplay && (
        <CollectionHeaderCard
          {...toCollectionHeaderCardProps(collectionForDisplay, isLoading, {
            onEditCollection: handleEditCollection,
            onDeleteCollection: handleDeleteCollection,
          })}
        />
      )}
      <h2 className="text-primary text-xl">
        {type === 'list' ? 'List content' : 'Pack content: items'}
      </h2>
      {itemsView}
    </div>
  );
}
