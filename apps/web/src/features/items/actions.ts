'use server';

import { getProductClient } from '@/lib/clients/product';
import { extractErrorMessage } from '@/utils/extract-error-message';

import { CreateItemBody, Item, UpdateItemBody } from './types';

export async function createItem(body: CreateItemBody): Promise<Item | undefined> {
  const productClient = await getProductClient();
  const { data, error } = await productClient.POST('/item', { body });

  if (error) throw new Error(extractErrorMessage(error));

  return data;
}

export async function updateItem(id: string, body: UpdateItemBody): Promise<Item | undefined> {
  const productClient = await getProductClient();
  const { data, error } = await productClient.PATCH('/item/{id}', {
    params: { path: { id } },
    body,
  });

  if (error) throw new Error(extractErrorMessage(error));

  return data;
}

export async function deleteItem(id: string): Promise<void> {
  const productClient = await getProductClient();
  const { error } = await productClient.DELETE('/item/{id}', {
    params: { path: { id } },
  });

  if (error) throw new Error(extractErrorMessage(error));
}
