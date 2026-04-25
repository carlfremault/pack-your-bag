import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';

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

const usePreferences = (): UseQueryResult<Preferences | null> => {
  return useQuery({
    queryKey: ['preferences'],
    queryFn: fetchPreferences,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

// -------------------------------
// Create item
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
// Update item
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
    mutationFn: ({ body }: { body: UpdatePreferencesBody }) => updatePreferences(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    },
  });
};

export { usePreferences, useCreatePreferences, useUpdatePreferences };
