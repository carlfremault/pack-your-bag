import { handleApiResponse, handleApiVoidResponse } from '@/lib/api-handlers';
import { getProductClient } from '@/lib/clients/product-client';

import { Category, CategoryDeleteImpact, CreateCategoryBody, UpdateCategoryBody } from './types';

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

export async function getCategoryDeleteImpact(id: string): Promise<CategoryDeleteImpact> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.GET('/category/{id}/delete-impact', {
    params: { path: { id } },
  });
  return handleApiResponse(data, error, response);
}

export async function deleteCategory(id: string): Promise<void> {
  const productClient = await getProductClient();
  const { error, response } = await productClient.DELETE('/category/{id}', {
    params: { path: { id } },
  });
  handleApiVoidResponse(error, response);
}
