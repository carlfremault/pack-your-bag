import type { RequestBody, SuccessResponse } from '@repo/product-client';

export type Trip = SuccessResponse<'/trip/{id}', 'get'>;
export type TripSummary = SuccessResponse<'/trip', 'get'>[number];
export type CreateTripBody = RequestBody<'/trip', 'post'>;
