import { handleApiResponse } from '@/lib/api-handlers';
import { getProductClient } from '@/lib/clients/product-client';

import {
  Collection,
  CreateListBody,
  CreatePackBody,
  List,
  ListSummary,
  Pack,
  PackSummary,
  UpdateListBody,
  UpdatePackBody,
} from './types';

export async function getList(id: string): Promise<List> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.GET('/list/{id}', {
    params: { path: { id } },
  });
  return handleApiResponse(data, error, response);
}

export async function getPack(id: string): Promise<Pack> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.GET('/pack/{id}', {
    params: { path: { id } },
  });
  return handleApiResponse(data, error, response);
}

export async function getAllLists(): Promise<ListSummary[]> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.GET('/list');
  return handleApiResponse(data, error, response);
}

export async function getAllPacks(): Promise<PackSummary[]> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.GET('/pack');
  return handleApiResponse(data, error, response);
}

export async function getAllCollections(): Promise<Collection[]> {
  const [lists, packs] = await Promise.all([getAllLists(), getAllPacks()]);

  const mappedLists: Collection[] = lists.map((list) => ({
    ...list,
    type: 'list' as const,
  }));

  const mappedPacks: Collection[] = packs.map((pack) => ({
    ...pack,
    type: 'pack' as const,
  }));

  return [...mappedLists, ...mappedPacks];
}

export async function createList(body: CreateListBody): Promise<List> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.POST('/list', { body });
  return handleApiResponse(data, error, response);
}

export async function createPack(body: CreatePackBody): Promise<Pack> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.POST('/pack', { body });
  return handleApiResponse(data, error, response);
}

export async function updateList(id: string, body: UpdateListBody): Promise<List> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.PATCH('/list/{id}', {
    params: { path: { id } },
    body,
  });
  return handleApiResponse(data, error, response);
}

export async function updatePack(id: string, body: UpdatePackBody): Promise<Pack> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.PATCH('/pack/{id}', {
    params: { path: { id } },
    body,
  });
  return handleApiResponse(data, error, response);
}
