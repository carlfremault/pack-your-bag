import type { RequestBody, SuccessResponse } from '@repo/product-client';
import { CategoryPillProps } from '@repo/react-common/pill';

export type Trip = SuccessResponse<'/trip/{id}', 'get'>;
export type TripSummary = SuccessResponse<'/trip', 'get'>[number];
export type CreateTripBody = RequestBody<'/trip', 'post'>;
export type UpdateTripBody = RequestBody<'/trip/{id}', 'patch'>;
export type UpdateTripItemStatusBody = RequestBody<'/trip/{id}/items/{itemId}/packed', 'patch'>;

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

export type TripItemForDisplay = {
  id: string;
  name: string;
  weight: number | null;
  displayWeight: string | null;
  displayUnit: string | null;
  category: { id: string; name: string; colorTheme: string } | null;
  quantity: number;
  packedQuantity: number;
};
