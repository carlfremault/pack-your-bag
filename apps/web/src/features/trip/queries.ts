import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
  UseSuspenseQueryResult,
} from '@tanstack/react-query';

import { toHttpError } from '@/utils/http-error';

import { CreateTripBody, Trip, TripSummary, UpdateTripBody } from './types';

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
// Fetch trip
// -------------------------------
const fetchTrip = async (id: string): Promise<Trip> => {
  const res = await fetch(`/api/trip/${id}`);

  if (!res.ok) {
    throw await toHttpError(res);
  }
  const { data } = await res.json();
  return data;
};

const useTrip = (id: string): UseSuspenseQueryResult<Trip> => {
  return useSuspenseQuery({
    queryKey: ['trips', id],
    queryFn: () => fetchTrip(id),
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

// -------------------------------
// Update Trip
// -------------------------------
const updateTrip = async ({ id, body }: { id: string; body: UpdateTripBody }): Promise<Trip> => {
  const res = await fetch(`/api/trip/${id}`, {
    method: 'PATCH',
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

const useUpdateTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTrip,
    onMutate: async ({ id, body }) => {
      await queryClient.cancelQueries({ queryKey: ['trips'] });

      const previousTrip = queryClient.getQueryData<Trip>(['trips', id]);

      queryClient.setQueryData(['trips', id], (old: Trip | undefined) => {
        if (!old) return old;
        return {
          ...old,
          name: body.name ?? old.name,
          date: body.date ?? old.date,
          remarks: body.remarks ?? old.remarks,
          updatedAt: new Date().toISOString(),
        };
      });

      return { previousTrip, id };
    },
    onError: (_error, _body, context) => {
      if (context?.previousTrip !== undefined) {
        queryClient.setQueryData(['trips', context.id], context.previousTrip);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
};

export { useAllTrips, useTrip, useCreateTrip, useUpdateTrip };
