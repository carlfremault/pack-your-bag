import { handleApiResponse, handleApiVoidResponse } from '@/lib/api-handlers';
import { getProductClient } from '@/lib/clients/product-client';

import { CreateTripBody, Trip, TripSummary, UpdateTripBody } from './types';

export async function getAllTrips(): Promise<TripSummary[]> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.GET('/trip');
  return handleApiResponse(data, error, response);
}

export async function getTrip(id: string): Promise<Trip> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.GET('/trip/{id}', {
    params: { path: { id } },
  });
  return handleApiResponse(data, error, response);
}

export async function createTrip(body: CreateTripBody): Promise<Trip> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.POST('/trip', { body });
  return handleApiResponse(data, error, response);
}

export async function updateTrip(id: string, body: UpdateTripBody): Promise<Trip> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.PATCH('/trip/{id}', {
    params: { path: { id } },
    body,
  });
  return handleApiResponse(data, error, response);
}

export async function deleteTrip(id: string): Promise<void> {
  const productClient = await getProductClient();
  const { error, response } = await productClient.DELETE('/trip/{id}', {
    params: { path: { id } },
  });
  handleApiVoidResponse(error, response);
}
