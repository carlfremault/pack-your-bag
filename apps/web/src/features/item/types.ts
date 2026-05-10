import type { RequestBody, SuccessResponse } from '@repo/product-client';

export type Item = SuccessResponse<'/item/{id}', 'get'>;
export type CreateItemBody = RequestBody<'/item', 'post'>;
export type UpdateItemBody = RequestBody<'/item/{id}', 'patch'>;

export type ItemForDisplay = Item & {
  displayWeight: string | null;
  displayUnit: string | null;
};
