'use client';

import { useCallback, useMemo } from 'react';
import { MdOutlineFormatListBulleted } from 'react-icons/md';

import { Alert } from '@repo/react-common/alert';
import { useBreakpoint } from '@repo/react-common/hooks';
import { QuantityStepper } from '@repo/react-common/input';

import { Modal } from '@/components/Modal';
import { usePreferences } from '@/features/settings/queries';
import { useStateFilterLists } from '@/hooks/useStateFilterLists';
import { formatWeightForDisplay } from '@/utils/weightUtils';

import { useUpsert } from '../hooks/useUpsert';
import { useAllCollections, useAllLists } from '../queries';
import {
  CollectionDetail,
  CollectionItemForDisplay,
  CollectionListForDisplayWithItems,
} from '../types';
import {
  getTotalItemQuantityInList,
  getTotalWeightInList,
  toCollectionItemForDisplay,
} from '../utils';

import { ListFilter } from './ListFilter';
import ListsList from './ListsList';

export interface AddListsModalProps {
  pack: CollectionDetail & { type: 'pack' };
}

export default function AddListsModal(props: AddListsModalProps) {
  const { pack } = props;

  const { isReady } = useBreakpoint();

  const {
    data: collections = [],
    isLoading: isListsLoading,
    isError: isListsError,
  } = useAllCollections();
  const { data: preferences, isLoading: isPreferencesLoading } = usePreferences();

  const lists = useMemo(
    () => collections.filter((collection) => collection.type === 'list'),
    [collections],
  );
  const listIds = useMemo(() => lists.map((collection) => collection.id), [lists]);
  const listDetails = useAllLists(listIds);
  const isListDetailsLoading = listDetails.some((query) => query.isPending);

  const isLoading = isListsLoading || isPreferencesLoading || isListDetailsLoading;

  const { quantities, handleUpsert, handleUpsertItemInList } = useUpsert(pack);

  const listsForDisplay = useMemo((): CollectionListForDisplayWithItems[] => {
    const detailsById: Record<string, CollectionDetail> = {};
    listDetails.forEach((q) => {
      if (q.data) detailsById[q.data.id] = q.data;
    });
    return lists.map((entry) => {
      const listQuantity = pack.lists?.find(({ list }) => list.id === entry.id)?.quantity ?? 0;
      const list = detailsById[entry.id];
      const totalWeight = list ? getTotalWeightInList(list) : 0;
      const itemCount = list ? getTotalItemQuantityInList(list) : 0;
      const { value, unit } = formatWeightForDisplay(totalWeight, preferences?.units);
      const listItems: CollectionItemForDisplay[] = (list?.items ?? []).map((item) =>
        toCollectionItemForDisplay(item, preferences?.units),
      );

      return {
        ...entry,
        type: 'list' as const,
        itemCount,
        totalWeight,
        quantity: listQuantity,
        displayWeight: value,
        displayUnit: unit,
        listItems,
      };
    });
  }, [lists, pack.lists, preferences?.units, listDetails]);

  const { filteredLists, displayFilterState, handleFilterChange } = useStateFilterLists({
    lists: listsForDisplay,
  });

  const upsertActions = useCallback(
    ({ id, quantity, type }: CollectionItemForDisplay | CollectionListForDisplayWithItems) => (
      <QuantityStepper
        id={id}
        type={type}
        quantity={quantities[id] ?? quantity}
        onChange={handleUpsert}
      />
    ),
    [handleUpsert, quantities],
  );

  const listItemUpsertActions = useCallback(
    (listId: string, item: CollectionItemForDisplay) => (
      <QuantityStepper
        id={item.id}
        type={item.type}
        quantity={quantities[item.id] ?? item.quantity}
        onChange={(id, qty, _type) => handleUpsertItemInList(id, qty, listId)}
      />
    ),
    [handleUpsertItemInList, quantities],
  );

  if (!isReady) return null;

  const errorContent = isListsError && !collections.length && (
    <div className="flex h-full w-full items-center justify-center p-8">
      <Alert type="error" message="Failed to load lists. Please try again later." />
    </div>
  );

  return (
    <Modal.Root>
      <Modal.Trigger ariaLabel="Add lists" className="w-full">
        <div className="flex items-center gap-2">
          <MdOutlineFormatListBulleted className="h-4 w-4" aria-hidden="true" />
          <span>Add lists</span>
        </div>
      </Modal.Trigger>
      <Modal.Content title="Add lists" modalWidth="3xl" className="h-full">
        <div className="flex h-full flex-col gap-4">
          {errorContent || (
            <>
              <ListFilter filterState={displayFilterState} onChange={handleFilterChange} />
              <div className="min-h-0 flex-1 md:overflow-y-auto">
                <ListsList
                  lists={filteredLists}
                  isLoading={isLoading}
                  upsertActions={upsertActions}
                  listItemUpsertActions={listItemUpsertActions}
                />
              </div>
            </>
          )}
        </div>
      </Modal.Content>
    </Modal.Root>
  );
}
