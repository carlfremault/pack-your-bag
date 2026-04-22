import { handleApiResponse } from '@/lib/api-handler';
import { getProductClient } from '@/lib/clients/product-client';

import { Category, CreateCategoryBody, UpdateCategoryBody } from './types';

export async function getAllCategories(): Promise<Category[]> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.GET('/category');
  return handleApiResponse(data, error, response);
}

export async function createCategory(body: CreateCategoryBody): Promise<Category> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.POST('/category', { body });
  return handleApiResponse(data, error, response);
}

export async function updateCategory(id: string, body: UpdateCategoryBody): Promise<Category> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.PATCH('/category/{id}', {
    params: { path: { id } },
    body,
  });
  return handleApiResponse(data, error, response);
}
