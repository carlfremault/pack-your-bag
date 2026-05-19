import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
  UseSuspenseQueryResult,
} from '@tanstack/react-query';

import { toHttpError } from '@/utils/http-error';

import { CreatePreferencesBody, Preferences, UpdatePreferencesBody } from './types';

// -------------------------------
// Fetch preferences
// -------------------------------
const fetchPreferences = async (): Promise<Preferences | null> => {
  const res = await fetch('/api/preferences');

  if (!res.ok) {
    throw await toHttpError(res);
  }
  const { data } = await res.json();
  return data ?? null;
};

const usePreferences = (): UseSuspenseQueryResult<Preferences | null> => {
  return useSuspenseQuery({
    queryKey: ['preferences'],
    queryFn: fetchPreferences,
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

// -------------------------------
// Create preferences
// -------------------------------
const createPreferences = async (body: CreatePreferencesBody): Promise<Preferences> => {
  const res = await fetch('/api/preferences', {
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

const useCreatePreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    },
  });
};

// -------------------------------
// Update preferences
// -------------------------------
const updatePreferences = async (body: UpdatePreferencesBody): Promise<Preferences> => {
  const res = await fetch('/api/preferences', {
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

const useUpdatePreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePreferences,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['preferences'] });

      const previousPreferences = queryClient.getQueryData<Preferences | null>(['preferences']);

      queryClient.setQueryData<Preferences | null>(['preferences'], (old) =>
        old ? { ...old, ...variables } : old,
      );
      return { previousPreferences };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousPreferences !== undefined) {
        queryClient.setQueryData(['preferences'], context.previousPreferences);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    },
  });
};

export { usePreferences, useCreatePreferences, useUpdatePreferences };
