import type { RequestBody, SuccessResponse } from '@repo/product-client';

export type Item = SuccessResponse<'/item/{id}', 'get'>;
export type CreateItemBody = RequestBody<'/item', 'post'>;
export type UpdateItemBody = RequestBody<'/item/{id}', 'patch'>;

export type ItemsResult = { data?: Item[]; error?: unknown; response: Response };
export type ItemResult = { data?: Item; error?: unknown; response: Response };
