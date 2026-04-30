import type { RequestBody, SuccessResponse } from '@repo/product-client';

export type List = SuccessResponse<'/list/{id}', 'get'>;
export type Pack = SuccessResponse<'/pack/{id}', 'get'>;
export type CreateListBody = RequestBody<'/list', 'post'>;
export type CreatePackBody = RequestBody<'/pack', 'post'>;

export type Collection = ((List & { type: 'list' }) | (Pack & { type: 'pack' })) & {
  numberOfItems: number;
  totalWeight: number;
};

export type CollectionForDisplay = Collection & {
  displayWeight: string;
  displayUnit: string;
};

export type CollectionType = Collection['type'];
