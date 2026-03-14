import { productClient } from '@repo/product-client';

import { ItemResult, ItemsResult } from './types';

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

export async function getItems(): Promise<ItemsResult> {
  return productClient.GET('/item', {
    headers: getHeaders(),
  });
}

export async function getItem(id: string): Promise<ItemResult> {
  return productClient.GET('/item/{id}', {
    params: { path: { id } },
    headers: getHeaders(),
  });
}
