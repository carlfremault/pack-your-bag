import type { RequestBody, SuccessResponse } from '@repo/product-client';

export type Item = SuccessResponse<'/item/{id}', 'get'>;
export type CreateItemBody = RequestBody<'/item', 'post'>;
