import type { RequestBody, SuccessResponse } from '@repo/product-client';
import { CategoryPillProps } from '@repo/react-common/pill';

export type Trip = SuccessResponse<'/trip/{id}', 'get'>;
export type TripSummary = SuccessResponse<'/trip', 'get'>[number];
export type CreateTripBody = RequestBody<'/trip', 'post'>;
export type UpdateTripBody = RequestBody<'/trip/{id}', 'patch'>;

export type TripForDetailsCardDisplay = Trip & {
  displayWeight: string;
  displayUnit: string;
  numberOfItems: number;
  numberOfItemsPacked: number;
  categoryItems: {
    category: CategoryPillProps;
    itemsNeeded: number;
    itemsPacked: number;
  }[];
};
