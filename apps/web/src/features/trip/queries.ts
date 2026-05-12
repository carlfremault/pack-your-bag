import { useSuspenseQuery, UseSuspenseQueryResult } from '@tanstack/react-query';

import { toHttpError } from '@/utils/http-error';

import { TripSummary } from './types';

// -------------------------------
// Fetch all trips
// -------------------------------
const fetchAllTrips = async (): Promise<TripSummary[]> => {
  const res = await fetch('/api/trip');

  if (!res.ok) {
    throw await toHttpError(res);
  }
  const { data } = await res.json();
  return data;
};

const useAllTrips = (): UseSuspenseQueryResult<TripSummary[]> => {
  return useSuspenseQuery({
    queryKey: ['trips'],
    queryFn: fetchAllTrips,
  });
};

export { useAllTrips };
