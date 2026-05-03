import type { RequestBody, SuccessResponse } from '@repo/product-client';
import type { ColorTheme } from '@repo/react-common/color-themes';

import type { ItemForDisplay } from '@/features/item/types';

export type ListSummary = SuccessResponse<'/list', 'get'>[number];
export type PackSummary = SuccessResponse<'/pack', 'get'>[number];
export type List = SuccessResponse<'/list/{id}', 'get'>;
export type Pack = SuccessResponse<'/pack/{id}', 'get'>;
export type CreateListBody = RequestBody<'/list', 'post'>;
export type CreatePackBody = RequestBody<'/pack', 'post'>;
export type UpdateListBody = RequestBody<'/list/{id}', 'patch'>;
export type UpdatePackBody = RequestBody<'/pack/{id}', 'patch'>;

export type Collection = (ListSummary & { type: 'list' }) | (PackSummary & { type: 'pack' });
export type CollectionType = Collection['type'];

export type CollectionDetail = (List & { type: 'list' }) | (Pack & { type: 'pack' });

export type CollectionForDisplay = Collection & {
  displayWeight: string;
  displayUnit: string;
};

export type CollectionForHeaderDisplay = CollectionForDisplay & {
  categoryWeights?: {
    category: { name: string; colorTheme: ColorTheme };
    weight: string;
  }[];
};

export type CollectionItemForDisplay = ItemForDisplay & { quantity: number };
export type CollectionListForDisplay = CollectionForDisplay & { quantity: number };
