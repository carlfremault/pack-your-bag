import { handleApiResponse } from '@/lib/api-handlers';
import { getUserDataClient } from '@/lib/clients/user-data-client';
import { ApiError } from '@/lib/errors';
import { extractErrorMessage } from '@/utils/extractApiErrorDetails';

import { CreatePreferencesBody, Preferences, UpdatePreferencesBody } from './types';

export async function getPreferences(): Promise<Preferences | null> {
  const userDataClient = await getUserDataClient();
  const { data, error, response } = await userDataClient.GET('/preferences');
  // Manual error handling since getPreferences should potentially return null
  if (error) throw new ApiError(extractErrorMessage(error), response?.status ?? 500);
  return data ?? null;
}

export async function createPreferences(body: CreatePreferencesBody): Promise<Preferences> {
  const userDataClient = await getUserDataClient();
  const { data, error, response } = await userDataClient.POST('/preferences', { body });
  return handleApiResponse(data, error, response);
}

export async function updatePreferences(body: UpdatePreferencesBody): Promise<Preferences> {
  const userDataClient = await getUserDataClient();
  const { data, error, response } = await userDataClient.PATCH('/preferences', { body });
  return handleApiResponse(data, error, response);
}
