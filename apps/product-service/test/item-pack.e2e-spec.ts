import { HttpStatus } from '@nestjs/common';

import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createIntegrationContext, IntegrationTestContext } from './helpers/setup.helpers';
describe('ItemPack (e2e)', () => {
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

  describe('ItemPack - /item-pack (POST)', () => {
    it('should upsert an item in a pack (create path)', async () => {
      const { body: item } = await ctx.itemHelpers.createItem({
        payload: ctx.itemHelpers.defaultItemDto,
        accessToken: validAccessToken,
      });
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: ctx.packHelpers.defaultPackDto,
        accessToken: validAccessToken,
      });

      const { body: itemPack } = await ctx.itemPackHelpers.upsertItemPack({
        payload: { itemId: item.id, packId: pack.id, quantity: 1 },
        accessToken: validAccessToken,
      });

      expect(itemPack).toMatchObject({
        itemId: item.id,
        packId: pack.id,
        quantity: 1,
      });
    });

    it('should upsert an item in a pack (update path)', async () => {
      const { body: item } = await ctx.itemHelpers.createItem({
        payload: ctx.itemHelpers.defaultItemDto,
        accessToken: validAccessToken,
      });
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: ctx.packHelpers.defaultPackDto,
        accessToken: validAccessToken,
      });

      const { body: itemPack } = await ctx.itemPackHelpers.upsertItemPack({
        payload: { itemId: item.id, packId: pack.id, quantity: 1 },
        accessToken: validAccessToken,
      });

      expect(itemPack).toMatchObject({
        itemId: item.id,
        packId: pack.id,
        quantity: 1,
      });

      const { body: updatedItemPack } = await ctx.itemPackHelpers.upsertItemPack({
        payload: { itemId: item.id, packId: pack.id, quantity: 2 },
        accessToken: validAccessToken,
      });

      expect(updatedItemPack).toMatchObject({
        itemId: item.id,
        packId: pack.id,
        quantity: 2,
      });
    });

    it('should return 404 if the item is not found', async () => {
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: ctx.packHelpers.defaultPackDto,
        accessToken: validAccessToken,
      });

      const { body: itemPack } = await ctx.itemPackHelpers.upsertItemPack({
        payload: { itemId: uuidv7(), packId: pack.id, quantity: 1 },
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(itemPack).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 404 if the pack is not found', async () => {
      const { body: item } = await ctx.itemHelpers.createItem({
        payload: ctx.itemHelpers.defaultItemDto,
        accessToken: validAccessToken,
      });

      const { body: itemPack } = await ctx.itemPackHelpers.upsertItemPack({
        payload: { itemId: item.id, packId: uuidv7(), quantity: 1 },
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(itemPack).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 404 if the item and pack do not belong to the same user', async () => {
      const { body: item } = await ctx.itemHelpers.createItem({
        payload: ctx.itemHelpers.defaultItemDto,
        accessToken: validAccessToken,
      });
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: ctx.packHelpers.defaultPackDto,
        accessToken: validAccessToken2,
      });

      const { body: itemPack } = await ctx.itemPackHelpers.upsertItemPack({
        payload: { itemId: item.id, packId: pack.id, quantity: 1 },
        accessToken: validAccessToken2,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(itemPack).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body: item } = await ctx.itemHelpers.createItem({
        payload: ctx.itemHelpers.defaultItemDto,
        accessToken: validAccessToken,
      });
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: ctx.packHelpers.defaultPackDto,
        accessToken: validAccessToken,
      });

      const { body: itemPack } = await ctx.itemPackHelpers.upsertItemPack({
        payload: { itemId: item.id, packId: pack.id, quantity: 1 },
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(itemPack).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 400 if the payload is invalid', async () => {
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: ctx.packHelpers.defaultPackDto,
        accessToken: validAccessToken,
      });

      const { body: itemPack } = await ctx.itemPackHelpers.upsertItemPack({
        payload: { packId: pack.id, quantity: 1 },
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(itemPack).toMatchObject({
        error: 'Bad Request',
      });
    });
  });

  describe('ItemPack - /item-pack (DELETE)', () => {
    it('should remove an item from a pack', async () => {
      const { body: item } = await ctx.itemHelpers.createItem({
        payload: ctx.itemHelpers.defaultItemDto,
        accessToken: validAccessToken,
      });
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: ctx.packHelpers.defaultPackDto,
        accessToken: validAccessToken,
      });
      await ctx.itemPackHelpers.upsertItemPack({
        payload: { itemId: item.id, packId: pack.id, quantity: 1 },
        accessToken: validAccessToken,
      });

      await ctx.itemPackHelpers.removeItemFromPack({
        itemId: item.id,
        packId: pack.id,
        accessToken: validAccessToken,
      });

      const { body: updatedPack } = await ctx.packHelpers.getPack({
        id: pack.id,
        accessToken: validAccessToken,
      });
      expect(updatedPack.items).toHaveLength(0);
    });

    it('should return 404 if the item is not found', async () => {
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: ctx.packHelpers.defaultPackDto,
        accessToken: validAccessToken,
      });

      const { body } = await ctx.itemPackHelpers.removeItemFromPack({
        itemId: uuidv7(),
        packId: pack.id,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({ error: 'Not Found' });
    });

    it('should return 404 if the pack is not found', async () => {
      const { body: item } = await ctx.itemHelpers.createItem({
        payload: ctx.itemHelpers.defaultItemDto,
        accessToken: validAccessToken,
      });

      const { body } = await ctx.itemPackHelpers.removeItemFromPack({
        itemId: item.id,
        packId: uuidv7(),
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({ error: 'Not Found' });
    });

    it('should return 404 if the item does not belong to the pack', async () => {
      const { body: item } = await ctx.itemHelpers.createItem({
        payload: ctx.itemHelpers.defaultItemDto,
        accessToken: validAccessToken,
      });
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: ctx.packHelpers.defaultPackDto,
        accessToken: validAccessToken,
      });

      const { body } = await ctx.itemPackHelpers.removeItemFromPack({
        itemId: item.id,
        packId: pack.id,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({ error: 'Not Found' });
    });

    it('should return 404 if the item and pack do not belong to the same user', async () => {
      const { body: item } = await ctx.itemHelpers.createItem({
        payload: ctx.itemHelpers.defaultItemDto,
        accessToken: validAccessToken,
      });
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: ctx.packHelpers.defaultPackDto,
        accessToken: validAccessToken2,
      });

      const { body } = await ctx.itemPackHelpers.removeItemFromPack({
        itemId: item.id,
        packId: pack.id,
        accessToken: validAccessToken2,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({ error: 'Not Found' });
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body: item } = await ctx.itemHelpers.createItem({
        payload: ctx.itemHelpers.defaultItemDto,
        accessToken: validAccessToken,
      });
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: ctx.packHelpers.defaultPackDto,
        accessToken: validAccessToken,
      });

      const { body } = await ctx.itemPackHelpers.removeItemFromPack({
        itemId: item.id,
        packId: pack.id,
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({ error: 'Unauthorized' });
    });
  });
});
