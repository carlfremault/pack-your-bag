'use client';

import { Suspense, useMemo } from 'react';
import { MdOutlineFormatListBulleted } from 'react-icons/md';

import { useBreakpoint } from '@repo/react-common/hooks';
import { QuantityStepper } from '@repo/react-common/input';

import { EmptyState } from '@/components/EmptyState';
import { Modal } from '@/components/Modal';
import { AddModalTitle } from '@/components/Modal/ModalTitle';
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

import AddListsModalSkeleton from './AddListsModalSkeleton';
import ListCardsList from './ListCardsList';
import ListFilter from './ListFilter';

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
      <Modal.Content
        title={<AddModalTitle label="Add lists" />}
        modalWidth="3xl"
        className="h-full"
      >
        <Suspense fallback={<AddListsModalSkeleton />}>
          <AddListsModalContent
            pack={pack}
            handleUpsertItemInList={handleUpsertItemInList}
            handleUpsertListInPack={handleUpsertListInPack}
          />
        </Suspense>
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
  const { data: collections } = useAllCollections();
  const { data: preferences } = usePreferences();

  const lists = useMemo(
    () => collections.filter((collection) => collection.type === 'list'),
    [collections],
  );
  const listIds = useMemo(() => lists.map((collection) => collection.id), [lists]);
  const { detailsById: listDetailsById } = useAllLists(listIds);

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

  const noResults = (
    <EmptyState
      message="No lists found."
      suggestion="Create some lists to organize your items!"
      hasActiveFilters={!!displayFilterState.search}
    />
  );

  return (
    <div className="flex h-full flex-col gap-4">
      <ListFilter filterState={displayFilterState} onChange={handleFilterChange} />
      <div className="min-h-0 flex-1 md:overflow-y-auto">
        <ListCardsList
          lists={filteredLists}
          upsertActions={renderListUpsertActions}
          listItemUpsertActions={renderListItemUpsertActions}
          noResults={noResults}
        />
      </div>
    </div>
  );
}
