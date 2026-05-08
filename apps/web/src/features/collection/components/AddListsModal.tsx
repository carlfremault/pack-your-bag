'use client';

import { useMemo } from 'react';
import { MdOutlineFormatListBulleted } from 'react-icons/md';

import { Alert } from '@repo/react-common/alert';
import { useBreakpoint } from '@repo/react-common/hooks';
import { QuantityStepper } from '@repo/react-common/input';

import { Modal } from '@/components/Modal';
import { usePreferences } from '@/features/settings/queries';
import { formatWeightForDisplay } from '@/utils/weightUtils';

import { useStateFilterLists } from '../hooks/useStateFilterLists';
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

  const { handleUpsertListInPack, handleUpsertItemInList } = useUpsert(pack);
  const { isReady } = useBreakpoint();

  if (!isReady) return null;

  return (
    <Modal.Root>
      <Modal.Trigger ariaLabel="Add lists" className="w-full">
        <div className="flex items-center gap-2">
          <MdOutlineFormatListBulleted className="h-4 w-4" aria-hidden="true" />
          <span>Add lists</span>
        </div>
      </Modal.Trigger>
      <Modal.Content title="Add lists" modalWidth="3xl" className="h-full">
        <AddListsModalContent
          pack={pack}
          handleUpsertItemInList={handleUpsertItemInList}
          handleUpsertListInPack={handleUpsertListInPack}
        />
      </Modal.Content>
    </Modal.Root>
  );
}

interface AddListsModalContentProps {
  pack: CollectionDetail & { type: 'pack' };
  handleUpsertItemInList: (itemId: string, quantity: number, listId: string) => void;
  handleUpsertListInPack: (listId: string, quantity: number, packId: string) => void;
}

function AddListsModalContent(props: AddListsModalContentProps) {
  const { pack, handleUpsertItemInList, handleUpsertListInPack } = props;
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
  const { detailsById: listDetailsById, isLoading: isListDetailsLoading } = useAllLists(listIds);
  const isLoading = isListsLoading || isPreferencesLoading || isListDetailsLoading;

  const listsForDisplay = useMemo((): CollectionListForDisplayWithItems[] => {
    return lists.map((entry) => {
      const listQuantity = pack.lists?.find(({ list }) => list.id === entry.id)?.quantity ?? 0;
      const list = listDetailsById[entry.id];
      const totalWeight = list ? getTotalWeightInList(list) : 0;
      const itemCount = list ? getTotalItemQuantityInList(list) : 0;
      const { value, unit } = formatWeightForDisplay(totalWeight, preferences?.units);
      const listItems: CollectionItemForDisplay[] = (list?.items ?? [])
        .map((item) => toCollectionItemForDisplay(item, preferences?.units))
        .sort((a, b) => a.name.localeCompare(b.name));

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
  }, [lists, pack.lists, preferences?.units, listDetailsById]);

  const { filteredLists, displayFilterState, handleFilterChange } = useStateFilterLists({
    lists: listsForDisplay,
  });

  const renderListUpsertActions = (list: CollectionListForDisplayWithItems) => (
    <QuantityStepper
      quantity={list.quantity}
      onChange={(qty) => handleUpsertListInPack(list.id, qty, pack.id)}
    />
  );

  const renderListItemUpsertActions = (item: CollectionItemForDisplay, listId: string) => (
    <QuantityStepper
      quantity={item.quantity}
      onChange={(qty) => handleUpsertItemInList(item.id, qty, listId)}
    />
  );

  if (isListsError && !collections.length)
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <Alert type="error" message="Failed to load lists. Please try again later." />
      </div>
    );

  return (
    <div className="flex h-full flex-col gap-4">
      <ListFilter filterState={displayFilterState} onChange={handleFilterChange} />
      <div className="min-h-0 flex-1 md:overflow-y-auto">
        <ListsList
          lists={filteredLists}
          isLoading={isLoading}
          upsertActions={renderListUpsertActions}
          listItemUpsertActions={renderListItemUpsertActions}
        />
      </div>
    </div>
  );
}
