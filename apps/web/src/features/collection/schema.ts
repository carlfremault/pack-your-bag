import { schemas } from '@repo/product-client';

export const createListSchema = schemas.CreateListDto;
export const createPackSchema = schemas.CreatePackDto;
export const updateListSchema = schemas.UpdateListDto;
export const updatePackSchema = schemas.UpdatePackDto;
export const upsertItemListSchema = schemas.UpsertItemOnListDto;
export const upsertItemPackSchema = schemas.UpsertItemInPackDto;
export const upsertListPackSchema = schemas.UpsertListInPackDto;
