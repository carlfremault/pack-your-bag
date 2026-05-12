import { handleApiResponse } from '@/lib/api-handlers';
import { getProductClient } from '@/lib/clients/product-client';

import { TripSummary } from './types';

export async function getAllTrips(): Promise<TripSummary[]> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.GET('/trip');
  return handleApiResponse(data, error, response);
}
