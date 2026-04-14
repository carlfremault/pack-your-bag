import type { SuccessResponse } from '@repo/product-client';

export type Category = SuccessResponse<'/category/{id}', 'get'>;
