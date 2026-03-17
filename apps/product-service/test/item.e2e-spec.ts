import { HttpStatus } from '@nestjs/common';

import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { CreateCategoryDto } from '@/modules/category/dto/create-category.dto';
import { CreateItemDto } from '@/modules/item/dto/create-item.dto';
import { UpdateItemDto } from '@/modules/item/dto/update-item.dto';

import {
  createItemInCategory,
  createItemInMultiplePacks,
  createItemInMultiplePacksInMultipleTrips,
  createItemInPack,
  createItemInPackInTrip,
  createItemOnList,
  createItemOnListAndInPack,
  createItemOnMultipleLists,
} from './fixtures/product.fixtures';
import { isoDateMatcher } from './helpers/matchers.helpers';
import { createIntegrationContext, IntegrationTestContext } from './helpers/setup.helpers';

describe('Item (e2e)', () => {
  let ctx: IntegrationTestContext;
  let validAccessToken: string;
  let itemDto: CreateItemDto;
  let categoryDto: CreateCategoryDto;

  const userId = uuidv7();
  const itemId = uuidv7(); // This is the item id that will be used in "not found" tests

  beforeAll(async () => {
    ctx = await createIntegrationContext();
    validAccessToken = ctx.authHelpers.getValidAccessToken(userId);
    itemDto = ctx.itemHelpers.defaultItemDto;
    categoryDto = ctx.categoryHelpers.defaultCategoryDto;
  });

  beforeEach(async () => {
    await ctx.resetDb();
  });

  afterAll(async () => {
    await ctx?.close();
  });

  describe('Item - /item (POST)', () => {
    it('should create an item', async () => {
      const { body } = await ctx.itemHelpers.createItem({
        payload: itemDto,
        accessToken: validAccessToken,
      });

      expect(body).toMatchObject({
        id: expect.any(String) as string,
        name: itemDto.name,
        description: itemDto.description,
        weight: itemDto.weight,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
      });
    });

    it('should create an item with a category', async () => {
      const { body: category } = await ctx.categoryHelpers.createCategory({
        payload: categoryDto,
        accessToken: validAccessToken,
      });
      const { body } = await ctx.itemHelpers.createItem({
        payload: { ...itemDto, categoryId: category.id },
        accessToken: validAccessToken,
      });

      expect(body).toMatchObject({
        id: expect.any(String) as string,
        name: itemDto.name,
        description: itemDto.description,
        weight: itemDto.weight,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
        category: {
          id: category.id,
          name: category.name,
          description: category.description,
          colorCode: category.colorCode,
          createdAt: isoDateMatcher,
          updatedAt: isoDateMatcher,
        },
      });
    });

    it('should not create an item with a category id from another user', async () => {
      const { body: category } = await ctx.categoryHelpers.createCategory({
        payload: categoryDto,
        accessToken: validAccessToken,
      });
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);

      const { body } = await ctx.itemHelpers.createItem({
        payload: { ...itemDto, categoryId: category.id },
        accessToken: validAccessToken2,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body } = await ctx.itemHelpers.createItem({
        payload: itemDto,
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 400 if the payload is invalid', async () => {
      const { body } = await ctx.itemHelpers.createItem({
        payload: { name: 123 } as unknown as Partial<CreateItemDto>,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({
        error: 'Bad Request',
      });
    });

    it('should return 400 if the payload is missing required fields', async () => {
      const invalidDto = {
        description: 'Test Description',
        weight: 1,
      };

      const { body } = await ctx.itemHelpers.createItem({
        payload: invalidDto,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({
        error: 'Bad Request',
      });
    });
  });

  describe('Item - /item/:id (GET)', () => {
    it('should return an item', async () => {
      const { body } = await ctx.itemHelpers.createItem({
        payload: itemDto,
        accessToken: validAccessToken,
      });

      const { body: item } = await ctx.itemHelpers.getItem({
        id: body.id,
        accessToken: validAccessToken,
      });

      expect(item).toMatchObject({
        id: body.id,
        name: itemDto.name,
        description: itemDto.description,
        weight: itemDto.weight,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
      });
    });

    it('should return an item with a category', async () => {
      const { body: category } = await ctx.categoryHelpers.createCategory({
        payload: categoryDto,
        accessToken: validAccessToken,
      });

      const { body } = await ctx.itemHelpers.createItem({
        payload: { ...itemDto, categoryId: category.id },
        accessToken: validAccessToken,
      });

      const { body: item } = await ctx.itemHelpers.getItem({
        id: body.id,
        accessToken: validAccessToken,
      });

      expect(item).toMatchObject({
        id: body.id,
        name: itemDto.name,
        description: itemDto.description,
        weight: itemDto.weight,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
        category: {
          id: category.id,
          name: category.name,
          description: category.description,
          colorCode: category.colorCode,
          createdAt: isoDateMatcher,
          updatedAt: isoDateMatcher,
        },
      });
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body } = await ctx.itemHelpers.getItem({
        id: itemId,
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 404 if the item is not found', async () => {
      const { body } = await ctx.itemHelpers.getItem({
        id: itemId,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 404 if the item belongs to another user', async () => {
      const { body: item } = await ctx.itemHelpers.createItem({
        payload: itemDto,
        accessToken: validAccessToken,
      });
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);

      const { body } = await ctx.itemHelpers.getItem({
        id: item.id,
        accessToken: validAccessToken2,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 400 if the id is not a valid uuid v7', async () => {
      const { body } = await ctx.itemHelpers.getItem({
        id: 'invalid-id',
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({
        error: 'Bad Request',
      });
    });
  });

  describe('Item - /item (GET)', () => {
    it('should return all items', async () => {
      const { body: item1 } = await ctx.itemHelpers.createItem({
        payload: itemDto,
        accessToken: validAccessToken,
      });
      const { body: item2 } = await ctx.itemHelpers.createItem({
        payload: itemDto,
        accessToken: validAccessToken,
      });

      const { body: items } = await ctx.itemHelpers.getItems({
        accessToken: validAccessToken,
      });

      expect(items).toHaveLength(2);
      expect(items).toContainEqual(item1);
      expect(items).toContainEqual(item2);
    });

    it('should return an empty array if the user has no items', async () => {
      const { body } = await ctx.itemHelpers.getItems({
        accessToken: validAccessToken,
      });

      expect(body).toHaveLength(0);
      expect(body).toEqual([]);
    });

    it('should only return items belonging to the authenticated user', async () => {
      const { body: item } = await ctx.itemHelpers.createItem({
        payload: itemDto,
        accessToken: validAccessToken,
      });
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);

      const { body: itemsUser1 } = await ctx.itemHelpers.getItems({
        accessToken: validAccessToken,
      });
      const { body: itemsUser2 } = await ctx.itemHelpers.getItems({
        accessToken: validAccessToken2,
      });

      expect(itemsUser1).toHaveLength(1);
      expect(itemsUser1).toContainEqual(item);

      expect(itemsUser2).toHaveLength(0);
      expect(itemsUser2).toEqual([]);
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body } = await ctx.itemHelpers.getItems({
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({
        error: 'Unauthorized',
      });
    });
  });

  describe('Item - /item/:id (PATCH)', () => {
    it('should update an item (multiple fields)', async () => {
      const { body } = await ctx.itemHelpers.createItem({
        payload: itemDto,
        accessToken: validAccessToken,
      });

      const { body: createdItem } = await ctx.itemHelpers.getItem({
        id: body.id,
        accessToken: validAccessToken,
      });

      expect(createdItem).toMatchObject({
        name: itemDto.name,
        description: itemDto.description,
        weight: itemDto.weight,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
      });

      await ctx.itemHelpers.updateItem({
        id: body.id,
        payload: { name: 'Updated Name', description: 'Updated Description', weight: 2 },
        accessToken: validAccessToken,
      });

      const { body: updatedItem } = await ctx.itemHelpers.getItem({
        id: body.id,
        accessToken: validAccessToken,
      });

      expect(updatedItem).toMatchObject({
        name: 'Updated Name',
        description: 'Updated Description',
        weight: 2,
      });
    });

    it('should update an item (single field)', async () => {
      const { body } = await ctx.itemHelpers.createItem({
        payload: itemDto,
        accessToken: validAccessToken,
      });

      const { body: createdItem } = await ctx.itemHelpers.getItem({
        id: body.id,
        accessToken: validAccessToken,
      });

      expect(createdItem).toMatchObject({
        name: itemDto.name,
        description: itemDto.description,
        weight: itemDto.weight,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
      });

      await ctx.itemHelpers.updateItem({
        id: body.id,
        payload: { name: 'Updated Name' },
        accessToken: validAccessToken,
      });

      const { body: updatedItem } = await ctx.itemHelpers.getItem({
        id: body.id,
        accessToken: validAccessToken,
      });

      expect(updatedItem).toMatchObject({
        name: 'Updated Name',
        description: itemDto.description,
        weight: itemDto.weight,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
      });
    });

    it('should update an item and connect a category', async () => {
      const { body: category } = await ctx.categoryHelpers.createCategory({
        payload: categoryDto,
        accessToken: validAccessToken,
      });
      const { body } = await ctx.itemHelpers.createItem({
        payload: itemDto,
        accessToken: validAccessToken,
      });

      await ctx.itemHelpers.updateItem({
        id: body.id,
        payload: { categoryId: category.id },
        accessToken: validAccessToken,
      });

      const { body: updatedItem } = await ctx.itemHelpers.getItem({
        id: body.id,
        accessToken: validAccessToken,
      });

      expect(updatedItem).toMatchObject({
        category: { id: category.id },
      });
    });

    it('should update an item and disconnect a category', async () => {
      const { item, category } = await createItemInCategory(ctx, validAccessToken);

      const { body: createdItem } = await ctx.itemHelpers.getItem({
        id: item.id,
        accessToken: validAccessToken,
      });

      expect(createdItem).toMatchObject({
        category: { id: category.id },
      });

      await ctx.itemHelpers.updateItem({
        id: item.id,
        payload: { categoryId: null } as unknown as Partial<UpdateItemDto>,
        accessToken: validAccessToken,
      });

      const { body: updatedItem } = await ctx.itemHelpers.getItem({
        id: item.id,
        accessToken: validAccessToken,
      });

      expect(updatedItem).toMatchObject({
        category: null,
      });
    });

    it('should update an item without touching the category when categoryId is absent', async () => {
      const { item, category } = await createItemInCategory(ctx, validAccessToken);

      const { body: createdItem } = await ctx.itemHelpers.getItem({
        id: item.id,
        accessToken: validAccessToken,
      });

      expect(createdItem).toMatchObject({
        category: { id: category.id },
      });

      await ctx.itemHelpers.updateItem({
        id: item.id,
        payload: { name: 'Updated Name' },
        accessToken: validAccessToken,
      });

      const { body: updatedItem } = await ctx.itemHelpers.getItem({
        id: item.id,
        accessToken: validAccessToken,
      });

      expect(updatedItem).toMatchObject({
        category: { id: category.id },
      });
    });

    it('should not update an item with a category id from another user', async () => {
      const { item, category } = await createItemInCategory(ctx, validAccessToken);
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);

      const { body } = await ctx.itemHelpers.updateItem({
        id: item.id,
        payload: { categoryId: category.id },
        accessToken: validAccessToken2,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body } = await ctx.itemHelpers.updateItem({
        id: itemId,
        payload: itemDto,
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 404 if the item is not found', async () => {
      const { body } = await ctx.itemHelpers.updateItem({
        id: itemId,
        payload: itemDto,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 404 if the item belongs to another user', async () => {
      const { body: item } = await ctx.itemHelpers.createItem({
        payload: itemDto,
        accessToken: validAccessToken,
      });
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);

      const { body } = await ctx.itemHelpers.updateItem({
        id: item.id,
        payload: itemDto,
        accessToken: validAccessToken2,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 400 if the id is not a valid uuid v7', async () => {
      const { body } = await ctx.itemHelpers.updateItem({
        id: 'invalid-id',
        payload: itemDto,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({
        error: 'Bad Request',
      });
    });

    it('should return 400 if the payload is invalid', async () => {
      const { body } = await ctx.itemHelpers.updateItem({
        id: itemId,
        payload: { name: 123 } as unknown as Partial<UpdateItemDto>,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({
        error: 'Bad Request',
      });
    });
  });

  describe('Item - /item/:id (DELETE)', () => {
    it('should delete an item, not on any list or pack', async () => {
      const { body } = await ctx.itemHelpers.createItem({
        payload: itemDto,
        accessToken: validAccessToken,
      });

      await ctx.itemHelpers.deleteItem({
        id: body.id,
        accessToken: validAccessToken,
      });

      const { body: deletedItem } = await ctx.itemHelpers.getItem({
        id: body.id,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(deletedItem).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should delete an item, on a list', async () => {
      const { item, itemList } = await createItemOnList(ctx, validAccessToken);

      const itemListsBeforeDeletion = await ctx.prisma.itemList.findMany({
        where: {
          itemId: item.id,
        },
      });

      expect(itemListsBeforeDeletion).toHaveLength(1);
      expect(itemListsBeforeDeletion).toContainEqual(itemList);

      await ctx.itemHelpers.deleteItem({
        id: item.id,
        accessToken: validAccessToken,
      });

      const { body: deletedItem } = await ctx.itemHelpers.getItem({
        id: item.id,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(deletedItem).toMatchObject({
        error: 'Not Found',
      });

      const itemListsAfterDeletion = await ctx.prisma.itemList.findMany({
        where: {
          itemId: item.id,
        },
      });

      expect(itemListsAfterDeletion).toHaveLength(0);
    });

    it('should delete an item, in a pack', async () => {
      const { item, itemPack } = await createItemInPack(ctx, validAccessToken);

      const itemPacksBeforeDeletion = await ctx.prisma.itemPack.findMany({
        where: {
          itemId: item.id,
        },
      });

      expect(itemPacksBeforeDeletion).toHaveLength(1);
      expect(itemPacksBeforeDeletion).toContainEqual(itemPack);

      await ctx.itemHelpers.deleteItem({
        id: item.id,
        accessToken: validAccessToken,
      });

      const { body: deletedItem } = await ctx.itemHelpers.getItem({
        id: item.id,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(deletedItem).toMatchObject({
        error: 'Not Found',
      });

      const itemPacksAfterDeletion = await ctx.prisma.itemPack.findMany({
        where: {
          itemId: item.id,
        },
      });

      expect(itemPacksAfterDeletion).toHaveLength(0);
    });

    it('should delete an item, on a list and in a pack', async () => {
      const { item, itemList, itemPack } = await createItemOnListAndInPack(ctx, validAccessToken);

      const itemListsBeforeDeletion = await ctx.prisma.itemList.findMany({
        where: {
          itemId: item.id,
        },
      });

      expect(itemListsBeforeDeletion).toHaveLength(1);
      expect(itemListsBeforeDeletion).toContainEqual(itemList);

      const itemPacksBeforeDeletion = await ctx.prisma.itemPack.findMany({
        where: {
          itemId: item.id,
        },
      });

      expect(itemPacksBeforeDeletion).toHaveLength(1);
      expect(itemPacksBeforeDeletion).toContainEqual(itemPack);

      await ctx.itemHelpers.deleteItem({
        id: item.id,
        accessToken: validAccessToken,
      });

      const { body: deletedItem } = await ctx.itemHelpers.getItem({
        id: item.id,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(deletedItem).toMatchObject({
        error: 'Not Found',
      });

      const itemListsAfterDeletion = await ctx.prisma.itemList.findMany({
        where: {
          itemId: item.id,
        },
      });

      expect(itemListsAfterDeletion).toHaveLength(0);

      const itemPacksAfterDeletion = await ctx.prisma.itemPack.findMany({
        where: {
          itemId: item.id,
        },
      });

      expect(itemPacksAfterDeletion).toHaveLength(0);
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body } = await ctx.itemHelpers.deleteItem({
        id: itemId,
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 404 if the item is not found', async () => {
      const { body } = await ctx.itemHelpers.deleteItem({
        id: itemId,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 404 if the item belongs to another user', async () => {
      const { body: item } = await ctx.itemHelpers.createItem({
        payload: itemDto,
        accessToken: validAccessToken,
      });
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);

      const { body } = await ctx.itemHelpers.deleteItem({
        id: item.id,
        accessToken: validAccessToken2,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 400 if the id is not a valid uuid v7', async () => {
      const { body } = await ctx.itemHelpers.deleteItem({
        id: 'invalid-id',
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({
        error: 'Bad Request',
      });
    });
  });

  describe('Item - /item/:id/delete-impact (GET)', () => {
    it('should return the delete impact of an item which is not on any list or pack', async () => {
      const { body: item } = await ctx.itemHelpers.createItem({
        payload: itemDto,
        accessToken: validAccessToken,
      });

      const { body: impact } = await ctx.itemHelpers.getItemDeleteImpact({
        id: item.id,
        accessToken: validAccessToken,
      });

      expect(impact).toMatchObject({
        item,
        lists: [],
        packs: [],
        trips: [],
      });
    });

    it('should return the delete impact of an item which is on a list', async () => {
      const { item, list } = await createItemOnList(ctx, validAccessToken);

      const { body: impact } = await ctx.itemHelpers.getItemDeleteImpact({
        id: item.id,
        accessToken: validAccessToken,
      });

      expect(impact).toMatchObject({
        item,
        lists: [list],
        packs: [],
        trips: [],
      });
    });

    it('should return the delete impact of an item which is on multiple lists', async () => {
      const { item, list1, list2 } = await createItemOnMultipleLists(ctx, validAccessToken);

      const { body: impact } = await ctx.itemHelpers.getItemDeleteImpact({
        id: item.id,
        accessToken: validAccessToken,
      });

      expect(impact).toMatchObject({
        item,
        packs: [],
        trips: [],
      });
      expect(impact.lists).toHaveLength(2);
      expect(impact.lists).toEqual(expect.arrayContaining([list1, list2]));
    });

    it('should return the delete impact of an item which is in a pack', async () => {
      const { item, pack } = await createItemInPack(ctx, validAccessToken);

      const { body: impact } = await ctx.itemHelpers.getItemDeleteImpact({
        id: item.id,
        accessToken: validAccessToken,
      });

      expect(impact).toMatchObject({
        item,
        lists: [],
        packs: [pack],
        trips: [],
      });
    });

    it('should return the delete impact of an item which is in multiple packs', async () => {
      const { item, pack1, pack2 } = await createItemInMultiplePacks(ctx, validAccessToken);

      const { body: impact } = await ctx.itemHelpers.getItemDeleteImpact({
        id: item.id,
        accessToken: validAccessToken,
      });

      expect(impact).toMatchObject({
        item,
        lists: [],
        trips: [],
      });
      expect(impact.packs).toHaveLength(2);
      expect(impact.packs).toEqual(expect.arrayContaining([pack1, pack2]));
    });

    it('should return the delete impact of an item which is on a list and in a pack', async () => {
      const { item, list, pack } = await createItemOnListAndInPack(ctx, validAccessToken);

      const { body: impact } = await ctx.itemHelpers.getItemDeleteImpact({
        id: item.id,
        accessToken: validAccessToken,
      });

      expect(impact).toMatchObject({
        item,
        lists: [list],
        packs: [pack],
        trips: [],
      });
    });

    it('should return the delete impact of an item which is in a pack and in a trip', async () => {
      const { item, pack, trip } = await createItemInPackInTrip(ctx, validAccessToken);

      const { body: impact } = await ctx.itemHelpers.getItemDeleteImpact({
        id: item.id,
        accessToken: validAccessToken,
      });

      expect(impact).toMatchObject({
        item,
        lists: [],
        packs: [pack],
        trips: [{ id: trip.id }],
      });
    });

    it('should return the delete impact of an item which is in multiple packs and in multiple trips', async () => {
      const { item, pack1, pack2, trip1, trip2 } = await createItemInMultiplePacksInMultipleTrips(
        ctx,
        validAccessToken,
      );

      const { body: impact } = await ctx.itemHelpers.getItemDeleteImpact({
        id: item.id,
        accessToken: validAccessToken,
      });

      expect(impact).toMatchObject({
        item,
        lists: [],
      });
      expect(impact.packs).toHaveLength(2);
      expect(impact.packs).toEqual(expect.arrayContaining([pack1, pack2]));
      expect(impact.trips).toHaveLength(2);
      expect(impact.trips).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: trip1.id,
            name: trip1.name,
            date: trip1.date,
            remarks: trip1.remarks,
          }),
          expect.objectContaining({
            id: trip2.id,
            name: trip2.name,
            date: trip2.date,
            remarks: trip2.remarks,
          }),
        ]),
      );
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body } = await ctx.itemHelpers.getItemDeleteImpact({
        id: itemId,
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 404 if the item is not found', async () => {
      const { body } = await ctx.itemHelpers.getItemDeleteImpact({
        id: itemId,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 404 if the item belongs to another user', async () => {
      const { body: item } = await ctx.itemHelpers.createItem({
        payload: itemDto,
        accessToken: validAccessToken,
      });
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);

      const { body } = await ctx.itemHelpers.getItemDeleteImpact({
        id: item.id,
        accessToken: validAccessToken2,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 400 if the id is not a valid uuid v7', async () => {
      const { body } = await ctx.itemHelpers.getItemDeleteImpact({
        id: 'invalid-id',
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({
        error: 'Bad Request',
      });
    });
  });
});
