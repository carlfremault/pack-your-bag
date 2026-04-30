import type { SuccessResponse } from '@repo/product-client';

export type List = SuccessResponse<'/list/{id}', 'get'>;
export type Pack = SuccessResponse<'/pack/{id}', 'get'>;

export type Collection = ((List & { type: 'list' }) | (Pack & { type: 'pack' })) & {
  numberOfItems: number;
  totalWeight: number;
};

export type CollectionForDisplay = Collection & {
  displayWeight: string;
  displayUnit: string;
};
