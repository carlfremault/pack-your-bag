import { getProductClient } from '@/lib/clients/product-client';
import { ApiError } from '@/lib/errors';
import { extractErrorMessage } from '@/utils/extractApiErrorDetails';

import { Category } from './types';

export async function getAllCategories(): Promise<Category[]> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.GET('/category');

  if (error) {
    throw new ApiError(extractErrorMessage(error), response?.status ?? 500);
  }
  if (!data) throw new ApiError('No data returned', 500);

  return data;
}
