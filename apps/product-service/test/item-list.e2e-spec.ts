import { HttpStatus } from '@nestjs/common';

import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createIntegrationContext, IntegrationTestContext } from './helpers/setup.helpers';
describe('ItemList (e2e)', () => {
  let ctx: IntegrationTestContext;
  let validAccessToken: string;

  const userId = uuidv7();

  beforeAll(async () => {
    ctx = await createIntegrationContext();
    validAccessToken = ctx.authHelpers.getValidAccessToken(userId);
  });

  beforeEach(async () => {
    await ctx.resetDb();
  });

  afterAll(async () => {
    await ctx?.close();
  });

  describe('ItemList - /item-list (POST)', () => {
    it('should upsert an item on a list (create path)', async () => {
      const { body: item } = await ctx.itemHelpers.createItem({
        payload: ctx.itemHelpers.defaultItemDto,
        accessToken: validAccessToken,
      });
      const { body: list } = await ctx.listHelpers.createList({
        payload: ctx.listHelpers.defaultListDto,
        accessToken: validAccessToken,
      });

      const { body: itemList } = await ctx.itemListHelpers.upsertItemOnList({
        payload: { itemId: item.id, listId: list.id, quantity: 1 },
        accessToken: validAccessToken,
      });

      expect(itemList).toMatchObject({
        itemId: item.id,
        listId: list.id,
        quantity: 1,
      });
    });

    it('should upsert an item on a list (update path)', async () => {
      const { body: item } = await ctx.itemHelpers.createItem({
        payload: ctx.itemHelpers.defaultItemDto,
        accessToken: validAccessToken,
      });
      const { body: list } = await ctx.listHelpers.createList({
        payload: ctx.listHelpers.defaultListDto,
        accessToken: validAccessToken,
      });
      const { body: itemList } = await ctx.itemListHelpers.upsertItemOnList({
        payload: { itemId: item.id, listId: list.id, quantity: 1 },
        accessToken: validAccessToken,
      });

      expect(itemList).toMatchObject({
        itemId: item.id,
        listId: list.id,
        quantity: 1,
      });

      const { body: updatedItemList } = await ctx.itemListHelpers.upsertItemOnList({
        payload: { itemId: item.id, listId: list.id, quantity: 2 },
        accessToken: validAccessToken,
      });

      expect(updatedItemList).toMatchObject({
        itemId: item.id,
        listId: list.id,
        quantity: 2,
      });
    });

    it('should return 404 if the item is not found', async () => {
      const { body: list } = await ctx.listHelpers.createList({
        payload: ctx.listHelpers.defaultListDto,
        accessToken: validAccessToken,
      });

      const { body: itemList } = await ctx.itemListHelpers.upsertItemOnList({
        payload: { itemId: uuidv7(), listId: list.id, quantity: 1 },
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(itemList).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 404 if the list is not found', async () => {
      const { body: item } = await ctx.itemHelpers.createItem({
        payload: ctx.itemHelpers.defaultItemDto,
        accessToken: validAccessToken,
      });

      const { body: itemList } = await ctx.itemListHelpers.upsertItemOnList({
        payload: { itemId: item.id, listId: uuidv7(), quantity: 1 },
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(itemList).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 404 if item and list do not belong to the same user', async () => {
      const { body: item } = await ctx.itemHelpers.createItem({
        payload: ctx.itemHelpers.defaultItemDto,
        accessToken: validAccessToken,
      });
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);
      const { body: list } = await ctx.listHelpers.createList({
        payload: ctx.listHelpers.defaultListDto,
        accessToken: validAccessToken2,
      });

      const { body: itemList } = await ctx.itemListHelpers.upsertItemOnList({
        payload: { itemId: item.id, listId: list.id, quantity: 1 },
        accessToken: validAccessToken2,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(itemList).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body: item } = await ctx.itemHelpers.createItem({
        payload: ctx.itemHelpers.defaultItemDto,
        accessToken: validAccessToken,
      });
      const { body: list } = await ctx.listHelpers.createList({
        payload: ctx.listHelpers.defaultListDto,
        accessToken: validAccessToken,
      });

      const { body: itemList } = await ctx.itemListHelpers.upsertItemOnList({
        payload: { itemId: item.id, listId: list.id, quantity: 1 },
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(itemList).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 400 if the payload is invalid', async () => {
      const { body: list } = await ctx.listHelpers.createList({
        payload: ctx.listHelpers.defaultListDto,
        accessToken: validAccessToken,
      });

      const { body: itemList } = await ctx.itemListHelpers.upsertItemOnList({
        payload: { listId: list.id, quantity: 1 },
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(itemList).toMatchObject({
        error: 'Bad Request',
      });
    });
  });

  describe('ItemList - /item-list (DELETE)', () => {
    it('should remove an item from a list', async () => {
      const { body: item } = await ctx.itemHelpers.createItem({
        payload: ctx.itemHelpers.defaultItemDto,
        accessToken: validAccessToken,
      });
      const { body: list } = await ctx.listHelpers.createList({
        payload: ctx.listHelpers.defaultListDto,
        accessToken: validAccessToken,
      });
      await ctx.itemListHelpers.upsertItemOnList({
        payload: { itemId: item.id, listId: list.id, quantity: 1 },
        accessToken: validAccessToken,
      });

      await ctx.itemListHelpers.removeItemFromList({
        itemId: item.id,
        listId: list.id,
        accessToken: validAccessToken,
      });

      const { body: updatedList } = await ctx.listHelpers.getList({
        id: list.id,
        accessToken: validAccessToken,
      });
      expect(updatedList.items).toHaveLength(0);
    });

    it('should return 404 if the item is not found', async () => {
      const { body: list } = await ctx.listHelpers.createList({
        payload: ctx.listHelpers.defaultListDto,
        accessToken: validAccessToken,
      });

      const { body } = await ctx.itemListHelpers.removeItemFromList({
        itemId: uuidv7(),
        listId: list.id,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({ error: 'Not Found' });
    });

    it('should return 404 if the list is not found', async () => {
      const { body: item } = await ctx.itemHelpers.createItem({
        payload: ctx.itemHelpers.defaultItemDto,
        accessToken: validAccessToken,
      });

      const { body } = await ctx.itemListHelpers.removeItemFromList({
        itemId: item.id,
        listId: uuidv7(),
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({ error: 'Not Found' });
    });

    it('should return 404 if item and list do not belong to the same user', async () => {
      const { body: item } = await ctx.itemHelpers.createItem({
        payload: ctx.itemHelpers.defaultItemDto,
        accessToken: validAccessToken,
      });
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);
      const { body: list } = await ctx.listHelpers.createList({
        payload: ctx.listHelpers.defaultListDto,
        accessToken: validAccessToken2,
      });

      const { body } = await ctx.itemListHelpers.removeItemFromList({
        itemId: item.id,
        listId: list.id,
        accessToken: validAccessToken2,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({ error: 'Not Found' });
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body } = await ctx.itemListHelpers.removeItemFromList({
        itemId: uuidv7(),
        listId: uuidv7(),
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({ error: 'Unauthorized' });
    });
  });
});
