import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
  UseSuspenseQueryResult,
} from '@tanstack/react-query';

import { toHttpError } from '@/utils/http-error';

import { CreateTripBody, Trip, TripSummary } from './types';

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

// -------------------------------
// Create Trip
// -------------------------------
const createTrip = async (body: CreateTripBody): Promise<Trip> => {
  const res = await fetch('/api/trip', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw await toHttpError(res);
  }
  const { data } = await res.json();
  return data;
};

const nextOptimisticId = () => `optimistic-${crypto.randomUUID()}`;

const useCreateTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTrip,
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: ['trips'] });

      const previousTrips = queryClient.getQueryData<TripSummary[]>(['trips']) ?? [];

      const optimisticId = nextOptimisticId();
      const optimisticTrip: TripSummary = {
        id: optimisticId,
        name: body.name,
        date: body.date ?? null,
        remarks: body.remarks ?? null,
        pack: body.packId
          ? {
              id: '',
              name: '',
              description: null,
              colorTheme: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              itemCount: 0,
              totalWeight: 0,
            }
          : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        packedItemCount: 0,
      };

      queryClient.setQueryData(['trips'], (old: TripSummary[] = []) => [...old, optimisticTrip]);

      return { previousTrips, optimisticId };
    },
    onError: (_error, _body, context) => {
      if (context?.previousTrips !== undefined) {
        queryClient.setQueryData(['trips'], context.previousTrips);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
};

export { useAllTrips, useCreateTrip };
