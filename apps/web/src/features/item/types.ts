import type { SuccessResponse } from '@repo/product-client';

export type Item = SuccessResponse<'/item/{id}', 'get'>;
