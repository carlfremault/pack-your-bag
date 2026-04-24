import { z } from 'zod';

export const CategoryResponseDto = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    colorTheme: z.string(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const ItemResponseDto = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    weight: z.number().nullable(),
    category: CategoryResponseDto.nullable(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const CreateItemDto = z
  .object({
    name: z.string().min(1).max(128),
    description: z.string().max(1000).optional(),
    weight: z.number().gte(0).nullish(),
    categoryId: z.string().uuid().nullish(),
  })
  .passthrough();
export const ItemWithQuantityResponseDto = z
  .object({ quantity: z.number(), item: ItemResponseDto })
  .passthrough();
export const ListResponseDto = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    colorTheme: z.string().nullable(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    items: z.array(ItemWithQuantityResponseDto).optional(),
  })
  .passthrough();
export const ListWithQuantityResponseDto = z
  .object({ quantity: z.number(), list: ListResponseDto })
  .passthrough();
export const PackResponseDto = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    colorTheme: z.string().nullable(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    items: z.array(ItemWithQuantityResponseDto).optional(),
    lists: z.array(ListWithQuantityResponseDto).optional(),
  })
  .passthrough();
export const TripResponseDto = z
  .object({
    id: z.string(),
    name: z.string(),
    date: z.string().datetime({ offset: true }).nullable(),
    remarks: z.string().nullable(),
    pack: PackResponseDto,
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const ItemDeleteImpactDto = z
  .object({
    item: ItemResponseDto,
    lists: z.array(ListResponseDto),
    packs: z.array(PackResponseDto),
    trips: z.array(TripResponseDto),
  })
  .passthrough();
export const UpdateItemDto = z
  .object({
    name: z.string().min(1).max(128),
    description: z.string().max(1000),
    weight: z.number().gte(0).nullable(),
    categoryId: z.string().uuid().nullable(),
  })
  .partial()
  .passthrough();
export const CreateCategoryDto = z
  .object({
    name: z.string().min(1).max(32),
    description: z.string().optional(),
    colorTheme: z.string(),
  })
  .passthrough();
export const CategoryDeleteImpactDto = z
  .object({ category: CategoryResponseDto, items: z.array(ItemResponseDto) })
  .passthrough();
export const UpdateCategoryDto = z
  .object({ name: z.string().min(1).max(32), description: z.string(), colorTheme: z.string() })
  .partial()
  .passthrough();
export const CreateListDto = z
  .object({
    name: z.string(),
    description: z.string().optional(),
    colorTheme: z.string().optional(),
  })
  .passthrough();
export const ListSummaryResponseDto = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    colorTheme: z.string().nullable(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    itemCount: z.number(),
  })
  .passthrough();
export const ListDeleteImpactDto = z
  .object({
    list: ListSummaryResponseDto,
    packs: z.array(PackResponseDto),
    trips: z.array(TripResponseDto),
  })
  .passthrough();
export const UpdateListDto = z
  .object({ name: z.string(), description: z.string(), colorTheme: z.string() })
  .partial()
  .passthrough();
export const CreatePackDto = z
  .object({
    name: z.string(),
    description: z.string().optional(),
    colorTheme: z.string().optional(),
  })
  .passthrough();
export const PackSummaryResponseDto = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    colorTheme: z.string().nullable(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    itemCount: z.number(),
    listCount: z.number(),
  })
  .passthrough();
export const PackDeleteImpactDto = z
  .object({ pack: PackSummaryResponseDto, trips: z.array(TripResponseDto) })
  .passthrough();
export const UpdatePackDto = z
  .object({ name: z.string(), description: z.string(), colorTheme: z.string() })
  .partial()
  .passthrough();
export const CreateTripDto = z
  .object({
    name: z.string(),
    date: z.string().datetime({ offset: true }).optional(),
    remarks: z.string().optional(),
    packId: z.string().nullable(),
  })
  .passthrough();
export const UpdateTripDto = z
  .object({
    name: z.string(),
    date: z.string().datetime({ offset: true }),
    remarks: z.string(),
    packId: z.string().nullable(),
  })
  .partial()
  .passthrough();
export const UpsertItemOnListDto = z
  .object({ itemId: z.string(), listId: z.string(), quantity: z.number() })
  .passthrough();
export const UpsertItemInPackDto = z
  .object({ itemId: z.string(), packId: z.string(), quantity: z.number() })
  .passthrough();
export const UpsertListInPackDto = z
  .object({ listId: z.string(), packId: z.string(), quantity: z.number() })
  .passthrough();
