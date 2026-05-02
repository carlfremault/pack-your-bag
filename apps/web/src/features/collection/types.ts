import type { RequestBody, SuccessResponse } from '@repo/product-client';
import type { ColorTheme } from '@repo/react-common/color-themes';

export type ListSummary = SuccessResponse<'/list', 'get'>[number];
export type PackSummary = SuccessResponse<'/pack', 'get'>[number];
export type List = SuccessResponse<'/list/{id}', 'get'>;
export type Pack = SuccessResponse<'/pack/{id}', 'get'>;
export type CreateListBody = RequestBody<'/list', 'post'>;
export type CreatePackBody = RequestBody<'/pack', 'post'>;

export type Collection = (ListSummary & { type: 'list' }) | (PackSummary & { type: 'pack' });

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

export type CollectionType = Collection['type'];
