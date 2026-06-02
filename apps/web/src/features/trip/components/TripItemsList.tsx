import { TripItemCard } from '@repo/react-common/card';

import { toTripItemCardProps } from '@/lib/mappers/trip.mappers';

import { TripItemForDisplay } from '../types';

export interface TripItemsListProps {
  items: TripItemForDisplay[];
  itemsActions: (item: TripItemForDisplay) => React.ReactNode;
  noResults: React.ReactNode;
}

export default function TripItemsList(props: TripItemsListProps) {
  const { items, itemsActions, noResults } = props;

  if (!items.length) {
    return (
      <div className="bg-surface border-primary-ring text-primary rounded-md border p-6 text-center text-sm">
        {noResults}
      </div>
    );
  }

  return (
    <>
      {items.map((item) => (
        <TripItemCard key={item.id} {...toTripItemCardProps(item, itemsActions(item))} />
      ))}
    </>
  );
}
