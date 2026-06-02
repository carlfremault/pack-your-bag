import { useCallback, useMemo } from 'react';

import { QuantityStepper } from '@repo/react-common/input';

import { EmptyState } from '@/components/EmptyState';
import { Pack } from '@/features/collection/types';
import { getAllCategoriesInCollection } from '@/features/collection/utils';
import ItemFilter from '@/features/item/components/ItemFilter';
import { usePreferences } from '@/features/settings/queries';
import { getItemQuantitiesInPack } from '@/features/trip/utils';
import { useUrlFilterItems } from '@/hooks/useUrlFilterItems';
import { formatWeightForDisplay } from '@/utils/weightUtils';

import { useUpdateTrip } from '../hooks/useUpdateTrip';

import TripItemsList from './TripItemsList';
import TripItemsTable from './TripItemsTable';

export interface TripContentProps {
  tripId: string;
  pack: Pack;
}

export default function TripContent(props: TripContentProps) {
  const { tripId, pack } = props;

  const { data: preferences } = usePreferences();
  const { handleUpdateTripItemStatus } = useUpdateTrip();

  const packCategories = useMemo(
    () => getAllCategoriesInCollection({ ...pack, type: 'pack' }),
    [pack],
  );

  const itemsForTripDisplay = useMemo(() => {
    const itemQuantities = getItemQuantitiesInPack(pack);
    return itemQuantities.map((item) => {
      const { value: displayWeight, unit: displayUnit } =
        item.item.weight != null
          ? formatWeightForDisplay(item.item.weight, preferences?.units)
          : { value: null, unit: null };
      return {
        id: item.item.id,
        name: item.item.name,
        weight: item.item.weight,
        category: item.item.category ?? null,
        quantity: item.quantity,
        packedQuantity: item.packedQuantity ?? 0,
        displayWeight,
        displayUnit,
      };
    });
  }, [pack, preferences?.units]);

  const { filteredItems, displayFilterState, handleFilterChange } = useUrlFilterItems({
    items: itemsForTripDisplay,
    sortFieldKey: 'tripItemSortField',
    sortDirKey: 'tripItemSortDir',
  });

  const renderItemsUpsertActions = useCallback(
    (item: (typeof filteredItems)[number]) => (
      <QuantityStepper
        quantity={item.packedQuantity}
        max={item.quantity}
        onChange={(qty) => handleUpdateTripItemStatus(item.id, qty, tripId)}
        groupAriaLabel={`Packed quantity for ${item.name}`}
      />
    ),
    [handleUpdateTripItemStatus, tripId],
  );

  const noResults = (
    <EmptyState
      message="No items found."
      suggestion="Add some items to start packing!"
      hasActiveFilters={!!displayFilterState.search || !!displayFilterState.category}
    />
  );

  return (
    <>
      <ItemFilter
        filterState={displayFilterState}
        onChange={handleFilterChange}
        collectionCategories={packCategories}
      />
      {/* Mobile */}
      <div className="mb-32 flex w-full flex-col gap-2 lg:hidden">
        <TripItemsList
          items={filteredItems}
          itemsActions={renderItemsUpsertActions}
          noResults={noResults}
        />
      </div>
      {/* Desktop */}
      <div className="hidden min-h-0 flex-1 lg:block">
        <TripItemsTable
          items={filteredItems}
          actionsTitle="Packed"
          itemsActions={renderItemsUpsertActions}
          noResults={noResults}
        />
      </div>
    </>
  );
}
