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
export type ListDeleteImpact = SuccessResponse<'/list/{id}/delete-impact', 'get'>;
export type PackDeleteImpact = SuccessResponse<'/pack/{id}/delete-impact', 'get'>;

export type ItemList = SuccessResponse<'/item-list', 'post'>;
export type ItemPack = SuccessResponse<'/item-pack', 'post'>;
export type ListPack = SuccessResponse<'/list-pack', 'post'>;
export type UpsertItemListBody = RequestBody<'/item-list', 'post'>;
export type UpsertItemPackBody = RequestBody<'/item-pack', 'post'>;
export type UpsertListInPackBody = RequestBody<'/list-pack', 'post'>;

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

export type CollectionItemForDisplay = ItemForDisplay & { quantity: number; type: 'item' };
export type CollectionListForDisplay = CollectionForDisplay & { quantity: number; type: 'list' };
export type CollectionListForDisplayWithItems = CollectionListForDisplay & {
  listItems: CollectionItemForDisplay[];
};

export type PackContentRow =
  | (CollectionItemForDisplay & { entryType: 'item' })
  | (CollectionListForDisplayWithItems & { entryType: 'list' });
