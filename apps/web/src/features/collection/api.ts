import { handleApiResponse } from '@/lib/api-handlers';
import { getProductClient } from '@/lib/clients/product-client';
import {
  getTotalItemQuantityInList,
  getTotalItemQuantityInPack,
  getTotalWeightInList,
  getTotalWeightInPack,
} from '@/utils/collectionsUtils';

import { Collection, List, Pack } from './types';

export async function getAllLists(): Promise<List[]> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.GET('/list');
  return handleApiResponse(data, error, response);
}

export async function getAllPacks(): Promise<Pack[]> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.GET('/pack');
  return handleApiResponse(data, error, response);
}

export async function getAllCollections(): Promise<Collection[]> {
  const [lists, packs] = await Promise.all([getAllLists(), getAllPacks()]);

  const mappedLists: Collection[] = lists.map((list) => ({
    ...list,
    type: 'list' as const,
    totalWeight: getTotalWeightInList(list),
    numberOfItems: getTotalItemQuantityInList(list),
  }));

  const mappedPacks: Collection[] = packs.map((pack) => ({
    ...pack,
    type: 'pack' as const,
    totalWeight: getTotalWeightInPack(pack),
    numberOfItems: getTotalItemQuantityInPack(pack),
  }));

  return [...mappedLists, ...mappedPacks];
}
