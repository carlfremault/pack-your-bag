'use client';
import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { CollectionListCard } from '@repo/react-common/card';
import { InputToggle, QuantityStepper } from '@repo/react-common/input';

import ItemsList from '@/features/item/components/ItemsList';
import ItemsTable from '@/features/item/components/ItemsTable';
import { usePreferences } from '@/features/settings/queries';
import { toCollectionListCardProps } from '@/lib/mappers/collection.mapper';
import { getTotalItemQuantityInList, getTotalWeightInList } from '@/utils/collectionsUtils';
import { formatWeightForDisplay } from '@/utils/weightUtils';

import { CollectionDetail, CollectionItemForDisplay, CollectionListForDisplay } from '../types';

export interface CollectionContentProps {
  collection: CollectionDetail;
  isDesktop: boolean;
}

type ContentType = 'items' | 'lists';

const CONTENT_OPTIONS = [
  { value: 'items', label: 'Items' },
  { value: 'lists', label: 'Lists' },
] as const;

export default function CollectionContent(props: CollectionContentProps) {
  const { collection, isDesktop } = props;

  const searchParams = useSearchParams();
  const { data: preferences, isLoading: isPreferencesLoading } = usePreferences();
  const [content, setContent] = useState<ContentType>('items');
  const effectiveContent: ContentType = collection.type === 'pack' ? content : 'items';

  const collectionItemsForDisplay = useMemo((): CollectionItemForDisplay[] => {
    return (collection.items ?? []).map(({ quantity, item }) => {
      const { value, unit } =
        item.weight != null
          ? formatWeightForDisplay(Number(item.weight), preferences?.units)
          : { value: null, unit: null };
      return { ...item, quantity, displayWeight: value, displayUnit: unit };
    });
  }, [collection, preferences?.units]);

  const collectionListsForDisplay = useMemo((): CollectionListForDisplay[] => {
    if (collection.type !== 'pack') return [];
    return (collection.lists ?? []).map(({ quantity, list }) => {
      const totalWeight = getTotalWeightInList(list);
      const itemCount = getTotalItemQuantityInList(list);
      const { value, unit } = formatWeightForDisplay(totalWeight, preferences?.units);
      return {
        ...list,
        type: 'list' as const,
        itemCount,
        totalWeight,
        quantity,
        displayWeight: value,
        displayUnit: unit,
      };
    });
  }, [collection, preferences?.units]);

  const actionQuery = useMemo(() => {
    const action = searchParams.get('action');
    if (!action) return undefined;
    const params = new URLSearchParams();
    params.set('action', action);
    const id = searchParams.get('id');
    const editCollectionType = searchParams.get('edit-type');
    if (id) params.set('id', id);
    if (editCollectionType) params.set('edit-type', editCollectionType);
    return params.toString();
  }, [searchParams]);

  const itemsActions = useCallback(
    ({ quantity }: CollectionItemForDisplay | CollectionListForDisplay) => (
      // TODO: Implement quantity stepper onChange
      <QuantityStepper quantity={quantity} onChange={() => {}} />
    ),
    [],
  );

  const itemsView = isDesktop ? (
    <ItemsTable
      items={collectionItemsForDisplay}
      isLoading={isPreferencesLoading}
      actionsTitle="Quantity"
      actionSize={120}
      itemsActions={itemsActions}
    />
  ) : (
    <ItemsList
      items={collectionItemsForDisplay}
      isLoading={isPreferencesLoading}
      itemsActions={itemsActions}
    />
  );

  const listsView = (
    <div className="flex w-full flex-col gap-2">
      {collectionListsForDisplay.map((list) => (
        <CollectionListCard
          key={list.id}
          {...toCollectionListCardProps(list, itemsActions(list), Link, actionQuery)}
          className="last:mb-[25vh]"
        />
      ))}
    </div>
  );

  return (
    <>
      <div className="flex w-full items-center justify-between">
        <h2 className="text-primary text-xl">
          {collection.type === 'list' ? 'Content' : `Content: ${effectiveContent}`}
        </h2>
        {collection.type === 'pack' && (
          <InputToggle
            options={CONTENT_OPTIONS}
            value={content}
            onChange={setContent}
            ariaLabel="Content type"
          />
        )}
      </div>
      {effectiveContent === 'items' ? itemsView : listsView}
    </>
  );
}
