import { handleApiResponse, handleApiVoidResponse } from '@/lib/api-handlers';
import { getProductClient } from '@/lib/clients/product-client';

import {
  CloneListBody,
  ClonePackBody,
  Collection,
  CreateListBody,
  CreatePackBody,
  ItemList,
  ItemPack,
  List,
  ListDeleteImpact,
  ListPack,
  ListSummary,
  Pack,
  PackDeleteImpact,
  PackSummary,
  UpdateListBody,
  UpdatePackBody,
  UpsertItemListBody,
  UpsertItemPackBody,
  UpsertListInPackBody,
} from './types';

// -------------------------------
// Get functions
// -------------------------------

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

// -------------------------------
// Create functions
// -------------------------------

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

// -------------------------------
// Update functions
// -------------------------------

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

// -------------------------------
// Clone functions
// -------------------------------

export async function cloneList(id: string, body: CloneListBody): Promise<List> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.POST('/list/{id}/clone', {
    params: { path: { id } },
    body,
  });
  return handleApiResponse(data, error, response);
}

export async function clonePack(id: string, body: ClonePackBody): Promise<Pack> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.POST('/pack/{id}/clone', {
    params: { path: { id } },
    body,
  });
  return handleApiResponse(data, error, response);
}

// -------------------------------
// Delete functions
// -------------------------------

export async function getListDeleteImpact(id: string): Promise<ListDeleteImpact> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.GET('/list/{id}/delete-impact', {
    params: { path: { id } },
  });
  return handleApiResponse(data, error, response);
}

export async function getPackDeleteImpact(id: string): Promise<PackDeleteImpact> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.GET('/pack/{id}/delete-impact', {
    params: { path: { id } },
  });
  return handleApiResponse(data, error, response);
}

export async function deleteList(id: string): Promise<void> {
  const productClient = await getProductClient();
  const { error, response } = await productClient.DELETE('/list/{id}', {
    params: { path: { id } },
  });
  handleApiVoidResponse(error, response);
}

export async function deletePack(id: string): Promise<void> {
  const productClient = await getProductClient();
  const { error, response } = await productClient.DELETE('/pack/{id}', {
    params: { path: { id } },
  });
  handleApiVoidResponse(error, response);
}

// -------------------------------
// Upserting functions
// -------------------------------

export async function upsertItemOnList(body: UpsertItemListBody): Promise<ItemList> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.POST('/item-list', { body });
  return handleApiResponse(data, error, response);
}

export async function removeItemFromList(itemId: string, listId: string): Promise<void> {
  const productClient = await getProductClient();
  const { error, response } = await productClient.DELETE('/item-list/{itemId}/{listId}', {
    params: { path: { itemId, listId } },
  });
  handleApiVoidResponse(error, response);
}

export async function upsertItemInPack(body: UpsertItemPackBody): Promise<ItemPack> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.POST('/item-pack', { body });
  return handleApiResponse(data, error, response);
}

export async function removeItemFromPack(itemId: string, packId: string): Promise<void> {
  const productClient = await getProductClient();
  const { error, response } = await productClient.DELETE('/item-pack/{itemId}/{packId}', {
    params: { path: { itemId, packId } },
  });
  handleApiVoidResponse(error, response);
}

export async function upsertListInPack(body: UpsertListInPackBody): Promise<ListPack> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.POST('/list-pack', { body });
  return handleApiResponse(data, error, response);
}

export async function removeListFromPack(listId: string, packId: string): Promise<void> {
  const productClient = await getProductClient();
  const { error, response } = await productClient.DELETE('/list-pack/{listId}/{packId}', {
    params: { path: { listId, packId } },
  });
  handleApiVoidResponse(error, response);
}
