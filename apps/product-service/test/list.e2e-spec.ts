import { HttpStatus } from '@nestjs/common';

import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { CreateListDto } from '@/modules/list/dto/create-list.dto';
import { ListSummaryResponseDto } from '@/modules/list/dto/list-response.dto';
import { UpdateListDto } from '@/modules/list/dto/update-list.dto';

import {
  createItemOnList,
  createListInMultiplePacks,
  createListInMultiplePacksInMultipleTrips,
  createListInPack,
  createListInPackInTrip,
  createMultipleItemsOnList,
} from './fixtures/product.fixtures';
import { isoDateMatcher } from './helpers/matchers.helpers';
import { createIntegrationContext, IntegrationTestContext } from './helpers/setup.helpers';

describe('List (e2e)', () => {
  let ctx: IntegrationTestContext;
  let validAccessToken: string;
  let listDto: CreateListDto;

  const userId = uuidv7();
  const listId = uuidv7(); // This is the list id that will be used in "not found" tests

  beforeAll(async () => {
    ctx = await createIntegrationContext();
    validAccessToken = ctx.authHelpers.getValidAccessToken(userId);
    listDto = ctx.listHelpers.defaultListDto;
  });

  beforeEach(async () => {
    await ctx.resetDb();
  });

  afterAll(async () => {
    await ctx?.close();
  });

  describe('List - /list (POST)', () => {
    it('should create a list', async () => {
      const { body } = await ctx.listHelpers.createList({
        payload: listDto,
        accessToken: validAccessToken,
      });

      expect(body).toMatchObject({
        id: expect.any(String) as string,
        name: listDto.name,
        description: listDto.description,
        colorCode: listDto.colorCode,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
      });
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body } = await ctx.listHelpers.createList({
        payload: listDto,
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 400 if the payload is invalid', async () => {
      const { body } = await ctx.listHelpers.createList({
        payload: { name: 123 } as unknown as Partial<CreateListDto>,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({
        error: 'Bad Request',
      });
    });

    it('should return 400 if the payload is missing required fields', async () => {
      const { body } = await ctx.listHelpers.createList({
        payload: { description: 'Test Description', colorCode: '#000000' },
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({
        error: 'Bad Request',
      });
    });
  });

  describe('List - /list/:id (GET)', () => {
    it('should return a list', async () => {
      const { body } = await ctx.listHelpers.createList({
        payload: listDto,
        accessToken: validAccessToken,
      });

      const { body: list } = await ctx.listHelpers.getList({
        id: body.id,
        accessToken: validAccessToken,
      });

      expect(list).toMatchObject({
        id: body.id,
        name: listDto.name,
        description: listDto.description,
        colorCode: listDto.colorCode,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
      });
    });

    it('should return a list with its items', async () => {
      const { list, item } = await createItemOnList(ctx, validAccessToken);

      const { body: createdList } = await ctx.listHelpers.getList({
        id: list.id,
        accessToken: validAccessToken,
      });

      expect(createdList).toMatchObject({
        id: list.id,
        name: list.name,
        description: list.description,
        colorCode: list.colorCode,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
        items: [{ quantity: 1, item }],
      });
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body } = await ctx.listHelpers.getList({
        id: listId,
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 404 if the list is not found', async () => {
      const { body } = await ctx.listHelpers.getList({
        id: listId,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 404 if the list belongs to another user', async () => {
      const { body: list } = await ctx.listHelpers.createList({
        payload: listDto,
        accessToken: validAccessToken,
      });
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);

      const { body } = await ctx.listHelpers.getList({
        id: list.id,
        accessToken: validAccessToken2,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 400 if the id is not a valid uuid v7', async () => {
      const { body } = await ctx.listHelpers.getList({
        id: 'invalid-uuid',
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({
        error: 'Bad Request',
      });
    });
  });

  describe('List - /list (GET)', () => {
    it('should return all lists (empty lists)', async () => {
      const { body: list1 } = await ctx.listHelpers.createList({
        payload: listDto,
        accessToken: validAccessToken,
      });
      const { body: list2 } = await ctx.listHelpers.createList({
        payload: listDto,
        accessToken: validAccessToken,
      });

      const { body: lists } = await ctx.listHelpers.getLists({
        accessToken: validAccessToken,
      });

      expect(lists).toHaveLength(2);
      expect(lists).toContainEqual(
        expect.objectContaining({ id: list1.id, name: list1.name, itemCount: 0 }),
      );
      expect(lists).toContainEqual(
        expect.objectContaining({ id: list2.id, name: list2.name, itemCount: 0 }),
      );
    });

    it('should return all lists (with items)', async () => {
      const { list: list1 } = await createItemOnList(ctx, validAccessToken);
      const { list: list2 } = await createMultipleItemsOnList(ctx, validAccessToken);

      const { body: lists } = await ctx.listHelpers.getLists({
        accessToken: validAccessToken,
      });

      expect(lists).toHaveLength(2);
      expect(lists).toContainEqual(
        expect.objectContaining({ id: list1.id, name: list1.name, itemCount: 1 }),
      );
      expect(lists).toContainEqual(
        expect.objectContaining({ id: list2.id, name: list2.name, itemCount: 2 }),
      );
    });

    it('should return an empty array if the user has no lists', async () => {
      const { body } = await ctx.listHelpers.getLists({
        accessToken: validAccessToken,
      });

      expect(body).toEqual([]);
    });

    it('should only return lists belonging to the authenticated user', async () => {
      const { body: list } = await ctx.listHelpers.createList({
        payload: listDto,
        accessToken: validAccessToken,
      });
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);

      const { body: listsUser1 } = await ctx.listHelpers.getLists({
        accessToken: validAccessToken,
      });
      const { body: listsUser2 } = await ctx.listHelpers.getLists({
        accessToken: validAccessToken2,
      });

      expect(listsUser1).toHaveLength(1);
      expect(listsUser1).toContainEqual(
        expect.objectContaining({ id: list.id, name: list.name, itemCount: 0 }),
      );

      expect(listsUser2).toEqual([]);
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body } = await ctx.listHelpers.getLists({
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({
        error: 'Unauthorized',
      });
    });
  });

  describe('List - /list/:id (PATCH)', () => {
    it('should update a list (all fields)', async () => {
      const { body } = await ctx.listHelpers.createList({
        payload: listDto,
        accessToken: validAccessToken,
      });

      const { body: createdList } = await ctx.listHelpers.getList({
        id: body.id,
        accessToken: validAccessToken,
      });

      expect(createdList).toMatchObject({
        name: listDto.name,
        description: listDto.description,
        colorCode: listDto.colorCode,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
      });

      await ctx.listHelpers.updateList({
        id: body.id,
        payload: { name: 'Updated List', description: 'Updated Description', colorCode: '#FFFFFF' },
        accessToken: validAccessToken,
      });

      const { body: updatedList } = await ctx.listHelpers.getList({
        id: body.id,
        accessToken: validAccessToken,
      });

      expect(updatedList).toMatchObject({
        name: 'Updated List',
        description: 'Updated Description',
        colorCode: '#FFFFFF',
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
      });
    });

    it('should update a list (single field)', async () => {
      const { body } = await ctx.listHelpers.createList({
        payload: listDto,
        accessToken: validAccessToken,
      });

      const { body: createdList } = await ctx.listHelpers.getList({
        id: body.id,
        accessToken: validAccessToken,
      });

      expect(createdList).toMatchObject({
        name: listDto.name,
        description: listDto.description,
        colorCode: listDto.colorCode,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
      });

      await ctx.listHelpers.updateList({
        id: body.id,
        payload: { name: 'Updated List' },
        accessToken: validAccessToken,
      });

      const { body: updatedList } = await ctx.listHelpers.getList({
        id: body.id,
        accessToken: validAccessToken,
      });

      expect(updatedList).toMatchObject({
        name: 'Updated List',
        description: listDto.description,
        colorCode: listDto.colorCode,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
      });
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body } = await ctx.listHelpers.updateList({
        id: listId,
        payload: { name: 'Updated List' },
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 404 if the list is not found', async () => {
      const { body } = await ctx.listHelpers.updateList({
        id: listId,
        payload: { name: 'Updated List' },
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 404 if the list belongs to another user', async () => {
      const { body: list } = await ctx.listHelpers.createList({
        payload: listDto,
        accessToken: validAccessToken,
      });
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);

      const { body } = await ctx.listHelpers.updateList({
        id: list.id,
        payload: { name: 'Updated List' },
        accessToken: validAccessToken2,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 400 if the id is not a valid uuid v7', async () => {
      const { body } = await ctx.listHelpers.updateList({
        id: 'invalid-uuid',
        payload: { name: 'Updated List' },
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({
        error: 'Bad Request',
      });
    });

    it('should return 400 if the payload is invalid', async () => {
      const { body } = await ctx.listHelpers.updateList({
        id: listId,
        payload: { name: 123 } as unknown as Partial<UpdateListDto>,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({
        error: 'Bad Request',
      });
    });
  });

  describe('List - /list/:id (DELETE)', () => {
    it('should delete a list, not on any pack or trip', async () => {
      const { body } = await ctx.listHelpers.createList({
        payload: listDto,
        accessToken: validAccessToken,
      });

      await ctx.listHelpers.deleteList({
        id: body.id,
        accessToken: validAccessToken,
      });

      const { body: deletedList } = await ctx.listHelpers.getList({
        id: body.id,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(deletedList).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should delete a list, on a pack', async () => {
      const { list, listPack } = await createListInPack(ctx, validAccessToken);

      const listPacksBeforeDeletion = await ctx.prisma.listPack.findMany({
        where: {
          listId: list.id,
        },
      });

      expect(listPacksBeforeDeletion).toHaveLength(1);
      expect(listPacksBeforeDeletion).toContainEqual(listPack);

      await ctx.listHelpers.deleteList({
        id: list.id,
        accessToken: validAccessToken,
      });

      const { body: deletedList } = await ctx.listHelpers.getList({
        id: list.id,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(deletedList).toMatchObject({
        error: 'Not Found',
      });

      const listPacksAfterDeletion = await ctx.prisma.listPack.findMany({
        where: {
          listId: list.id,
        },
      });

      expect(listPacksAfterDeletion).toHaveLength(0);
    });

    it('should delete a list with items', async () => {
      const { list, item, itemList } = await createItemOnList(ctx, validAccessToken);

      const { body: createdList } = await ctx.listHelpers.getList({
        id: list.id,
        accessToken: validAccessToken,
      });

      expect(createdList).toMatchObject({
        id: list.id,
        name: list.name,
        description: list.description,
        colorCode: list.colorCode,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
        items: [{ quantity: 1, item }],
      });

      const itemListsBeforeDeletion = await ctx.prisma.itemList.findMany({
        where: {
          listId: list.id,
        },
      });

      expect(itemListsBeforeDeletion).toHaveLength(1);
      expect(itemListsBeforeDeletion).toContainEqual(itemList);

      await ctx.listHelpers.deleteList({
        id: list.id,
        accessToken: validAccessToken,
      });

      const { body: deletedList } = await ctx.listHelpers.getList({
        id: list.id,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(deletedList).toMatchObject({
        error: 'Not Found',
      });

      const itemListsAfterDeletion = await ctx.prisma.itemList.findMany({
        where: {
          listId: list.id,
        },
      });

      expect(itemListsAfterDeletion).toHaveLength(0);

      const itemAfterDeletion = await ctx.prisma.item.findUnique({
        where: { id: item.id },
      });
      expect(itemAfterDeletion).not.toBeNull();
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body } = await ctx.listHelpers.deleteList({
        id: listId,
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 404 if the list is not found', async () => {
      const { body } = await ctx.listHelpers.deleteList({
        id: listId,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 404 if the list belongs to another user', async () => {
      const { body: list } = await ctx.listHelpers.createList({
        payload: listDto,
        accessToken: validAccessToken,
      });
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);

      const { body } = await ctx.listHelpers.deleteList({
        id: list.id,
        accessToken: validAccessToken2,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 400 if the id is not a valid uuid v7', async () => {
      const { body } = await ctx.listHelpers.deleteList({
        id: 'invalid-uuid',
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({
        error: 'Bad Request',
      });
    });
  });

  describe('List - /list/:id/delete-impact (GET)', () => {
    it('should return the delete impact of a list, not on any pack or trip', async () => {
      const { body: list } = await ctx.listHelpers.createList({
        payload: listDto,
        accessToken: validAccessToken,
      });

      const { body: impact } = await ctx.listHelpers.getListDeleteImpact({
        id: list.id,
        accessToken: validAccessToken,
      });

      expect(impact).toMatchObject({
        list,
        packs: [],
        trips: [],
      });
    });

    it('should return the delete impact of a list, with items', async () => {
      const { list } = await createItemOnList(ctx, validAccessToken);

      const { body: impact } = await ctx.listHelpers.getListDeleteImpact({
        id: list.id,
        accessToken: validAccessToken,
      });

      expect(impact).toMatchObject({
        list: expect.objectContaining({ itemCount: 1 }) as ListSummaryResponseDto,
        packs: [],
        trips: [],
      });
    });

    it('should return the delete impact of a list, on a pack', async () => {
      const { list, pack } = await createListInPack(ctx, validAccessToken);

      const { body: impact } = await ctx.listHelpers.getListDeleteImpact({
        id: list.id,
        accessToken: validAccessToken,
      });

      expect(impact).toMatchObject({
        list,
        packs: [pack],
        trips: [],
      });
    });

    it('should return the delete impact of a list, in multiple packs', async () => {
      const { list, pack1, pack2 } = await createListInMultiplePacks(ctx, validAccessToken);

      const { body: impact } = await ctx.listHelpers.getListDeleteImpact({
        id: list.id,
        accessToken: validAccessToken,
      });

      expect(impact).toMatchObject({
        list,
        trips: [],
      });
      expect(impact.packs).toHaveLength(2);
      expect(impact.packs).toEqual(expect.arrayContaining([pack1, pack2]));
    });

    it('should return the delete impact of a list, in a pack and in a trip', async () => {
      const { list, pack, trip } = await createListInPackInTrip(ctx, validAccessToken);

      const { body: impact } = await ctx.listHelpers.getListDeleteImpact({
        id: list.id,
        accessToken: validAccessToken,
      });

      expect(impact).toMatchObject({
        list,
        packs: [pack],
        trips: [{ id: trip.id }],
      });
    });

    it('should return the delete impact of a list, in multiple packs and in multiple trips', async () => {
      const { list, pack1, pack2, trip1, trip2 } = await createListInMultiplePacksInMultipleTrips(
        ctx,
        validAccessToken,
      );

      const { body: impact } = await ctx.listHelpers.getListDeleteImpact({
        id: list.id,
        accessToken: validAccessToken,
      });

      expect(impact).toMatchObject({
        list,
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
      const { body } = await ctx.listHelpers.getListDeleteImpact({
        id: listId,
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 404 if the list is not found', async () => {
      const { body } = await ctx.listHelpers.getListDeleteImpact({
        id: listId,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 404 if the list belongs to another user', async () => {
      const { body: list } = await ctx.listHelpers.createList({
        payload: listDto,
        accessToken: validAccessToken,
      });
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);

      const { body } = await ctx.listHelpers.getListDeleteImpact({
        id: list.id,
        accessToken: validAccessToken2,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 400 if the id is not a valid uuid v7', async () => {
      const { body } = await ctx.listHelpers.getListDeleteImpact({
        id: 'invalid-uuid',
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({
        error: 'Bad Request',
      });
    });
  });
});
