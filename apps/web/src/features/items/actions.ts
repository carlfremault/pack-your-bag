'use server';

import { productClient } from '@repo/product-client';

import { extractErrorMessage } from '@/utils/extract-error-message';

import { CreateItemBody, Item, UpdateItemBody } from './types';

const bffSecret = process.env.BFF_SHARED_SECRET;
if (!bffSecret) {
  throw new Error('BFF_SHARED_SECRET environment variable is required');
}

// TODO: implement proper authentication
const tempAccessToken = 'insert token here';

const getHeaders = () => ({
  'x-bff-secret': bffSecret,
  Authorization: `Bearer ${tempAccessToken}`,
});

export async function createItem(body: CreateItemBody): Promise<Item | undefined> {
  const { data, error } = await productClient.POST('/item', {
    body,
    headers: getHeaders(),
  });

  if (error) throw new Error(extractErrorMessage(error));

  return data;
}

export async function updateItem(id: string, body: UpdateItemBody): Promise<Item | undefined> {
  const { data, error } = await productClient.PATCH('/item/{id}', {
    params: { path: { id } },
    body,
    headers: getHeaders(),
  });

  if (error) throw new Error(extractErrorMessage(error));

  return data;
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await productClient.DELETE('/item/{id}', {
    params: { path: { id } },
    headers: getHeaders(),
  });

  if (error) throw new Error(extractErrorMessage(error));
}
