import { handleApiResponse, handleApiVoidResponse } from '@/lib/api-handlers';
import { getProductClient } from '@/lib/clients/product-client';

import { CreateItemBody, Item, ItemDeleteImpact, UpdateItemBody } from './types';

export async function getAllItems(): Promise<Item[]> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.GET('/item');
  return handleApiResponse(data, error, response);
}

export async function createItem(body: CreateItemBody): Promise<Item> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.POST('/item', { body });
  return handleApiResponse(data, error, response);
}

export async function updateItem(id: string, body: UpdateItemBody): Promise<Item> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.PATCH('/item/{id}', {
    params: { path: { id } },
    body,
  });
  return handleApiResponse(data, error, response);
}

export async function getItemDeleteImpact(id: string): Promise<ItemDeleteImpact> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.GET('/item/{id}/delete-impact', {
    params: { path: { id } },
  });
  return handleApiResponse(data, error, response);
}

export async function deleteItem(id: string): Promise<void> {
  const productClient = await getProductClient();
  const { error, response } = await productClient.DELETE('/item/{id}', {
    params: { path: { id } },
  });
  handleApiVoidResponse(error, response);
}
