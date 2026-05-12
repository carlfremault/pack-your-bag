import { TripCard } from '@repo/react-common/card';

import { toTripCardProps } from '@/lib/mappers/trip.mappers';

import { TripSummary } from '../types';

export interface TripsListProps {
  trips: TripSummary[];
  linkAs: React.ElementType;
  dateFormat?: string;
}

export default function TripsList(props: TripsListProps) {
  const { trips, linkAs, dateFormat } = props;

  if (!trips.length) {
    return (
      <div className="flex w-full flex-col gap-2">
        <div className="bg-surface border-primary-ring text-primary col-span-full rounded-md border p-6 text-center text-sm">
          No trips found
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2 overflow-y-auto">
      {trips.map((trip) => (
        <TripCard key={trip.id} {...toTripCardProps(trip, linkAs, dateFormat)} />
      ))}
    </div>
  );
}
