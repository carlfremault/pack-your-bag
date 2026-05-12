'use client';

import Link from 'next/link';

import { usePreferences } from '@/features/settings/queries';

import { useFilterTrips } from '../hooks/useFilterTrips';
import { useAllTrips } from '../queries';

import { TripFilter } from './TripFilter';
import TripsList from './TripsList';

export default function TripsView() {
  const { data: trips } = useAllTrips();
  const { data: preferences } = usePreferences();

  const { filteredTrips, displayFilterState, handleFilterChange } = useFilterTrips({
    trips,
  });

  return (
    <div className="flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-4 p-4">
      <TripFilter filterState={displayFilterState} onChange={handleFilterChange} />
      <TripsList trips={filteredTrips} linkAs={Link} dateFormat={preferences?.dateFormat} />
    </div>
  );
}
