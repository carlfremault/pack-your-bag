import { handleApiResponse } from '@/lib/api-handlers';
import { getProductClient } from '@/lib/clients/product-client';

import { CreateTripBody, Trip, TripSummary } from './types';

export async function getAllTrips(): Promise<TripSummary[]> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.GET('/trip');
  return handleApiResponse(data, error, response);
}

export async function createTrip(body: CreateTripBody): Promise<Trip> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.POST('/trip', { body });
  return handleApiResponse(data, error, response);
}
