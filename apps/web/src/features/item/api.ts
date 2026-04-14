import { getProductClient } from '@/lib/clients/product-client';
import { ApiError } from '@/lib/errors';
import { extractErrorMessage } from '@/utils/extract-error-message';

import { Item } from './types';

export async function getAllItems(): Promise<Item[]> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.GET('/item');

  if (error) throw new ApiError(extractErrorMessage(error), response?.status ?? 500);
  if (!data) throw new ApiError('No data returned', 500);

  return data;
}
