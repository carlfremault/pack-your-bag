import type { RequestBody, SuccessResponse } from '@repo/product-client';

export type Category = SuccessResponse<'/category/{id}', 'get'>;
export type CategoryDeleteImpact = SuccessResponse<'/category/{id}/delete-impact', 'get'>;
export type CreateCategoryBody = RequestBody<'/category', 'post'>;
export type UpdateCategoryBody = RequestBody<'/category/{id}', 'patch'>;
